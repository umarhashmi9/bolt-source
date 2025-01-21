/// <reference types="vite/client" />
import { createReadableStreamFromReadable, createRequestHandler } from '@remix-run/node';
import type { ServerBuild } from '@remix-run/node';
import electron, { app, BrowserWindow, ipcMain, Menu, protocol, session } from 'electron';
import log from 'electron-log';
import ElectronStore from 'electron-store';
import mime from 'mime';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { ViteDevServer } from 'vite';
// eslint-disable-next-line no-restricted-imports
import * as pkg from '../../package.json';
import { setupAutoUpdater } from './auto-update';

// Conditionally import Vite only in development
let viteServer: ViteDevServer | undefined;
const initViteServer = async () => {
  if (!(global.process.env.NODE_ENV === 'production' || app.isPackaged)) {
    const vite = await import('vite');
    viteServer = await vite.createServer({
      root: '.',
      envDir: path.join(__dirname, '../..'), // load .env files from the root directory.
    });
  }
};

Object.assign(console, log.functions);

console.debug('main: import.meta.env:', import.meta.env);

const __dirname = fileURLToPath(import.meta.url);
const isDev = !(global.process.env.NODE_ENV === 'production' || app.isPackaged);

console.log('main: isDev:', isDev);
console.log('NODE_ENV:', global.process.env.NODE_ENV);
console.log('isPackaged:', app.isPackaged);

const DEFAULT_PORT = 5173;

// Log unhandled errors
process.on('uncaughtException', async (error) => {
  await console.log('Uncaught Exception:', error);
});

process.on('unhandledRejection', async (error) => {
  await console.log('Unhandled Rejection:', error);
});

(() => {
  const root = global.process.env.APP_PATH_ROOT ?? import.meta.env.VITE_APP_PATH_ROOT;

  if (root === undefined) {
    console.log('no given APP_PATH_ROOT or VITE_APP_PATH_ROOT. default path is used.');
    return;
  }

  if (!path.isAbsolute(root)) {
    console.log('APP_PATH_ROOT must be absolute path.');
    global.process.exit(1);
  }

  console.log(`APP_PATH_ROOT: ${root}`);

  const subdirName = pkg.name;

  for (const [key, val] of [
    ['appData', ''],
    ['userData', subdirName],
    ['sessionData', subdirName],
  ] as const) {
    app.setPath(key, path.join(root, val));
  }

  app.setAppLogsPath(path.join(root, `${subdirName}/Logs`));
})();

console.log('appPath:', app.getAppPath());

const keys: Parameters<typeof app.getPath>[number][] = ['home', 'appData', 'userData', 'sessionData', 'logs', 'temp'];
keys.forEach((key) => console.log(`${key}:`, app.getPath(key)));

const store = new ElectronStore<any>({ encryptionKey: 'something' });

/**
 * On app startup: read any existing cookies from store and set it as a cookie.
 */
async function initCookies() {
  await loadStoredCookies();
}

// Function to store all cookies
async function storeCookies() {
  const cookies = await session.defaultSession.cookies.get({});

  for (const cookie of cookies) {
    store.set(`cookie:${cookie.name}`, cookie);
  }
}

// Function to load stored cookies
async function loadStoredCookies() {
  // Get all keys that start with 'cookie:'
  const cookieKeys = store.store ? Object.keys(store.store).filter((key) => key.startsWith('cookie:')) : [];

  for (const key of cookieKeys) {
    const cookie = store.get(key);

    if (cookie) {
      try {
        // Add default URL if not present
        const cookieWithUrl = {
          ...cookie,
          url: cookie.url || `http://localhost:${DEFAULT_PORT}`,
        };
        await session.defaultSession.cookies.set(cookieWithUrl);
      } catch (error) {
        console.error(`Failed to set cookie ${key}:`, error);
      }
    }
  }
}

const createWindow = async (rendererURL: string) => {
  console.log('Creating window with URL:', rendererURL);

  const bounds = store.get('bounds');
  console.log('restored bounds:', bounds);

  const win = new BrowserWindow({
    ...{
      width: 1200,
      height: 800,
      ...bounds,
    },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, '../../preload/index.cjs'),
    },
  });

  console.log('Window created, loading URL...');
  win.loadURL(rendererURL).catch((err) => {
    console.log('Failed to load URL:', err);
  });

  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.log('Failed to load:', errorCode, errorDescription);
  });

  win.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });

  // Open devtools in development
  if (isDev) {
    win.webContents.openDevTools();
  }

  const boundsListener = () => {
    const bounds = win.getBounds();
    store.set('bounds', bounds);
  };
  win.on('moved', boundsListener);
  win.on('resized', boundsListener);

  return win;
};

console.log('start whenReady');

const rendererClientPath = isDev ? path.join(__dirname, '../../client') : path.join(app.getAppPath(), 'build/client');

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __electron__: typeof electron;
}

async function loadServerBuild(): Promise<any> {
  if (isDev) {
    console.log('Dev mode: server build not loaded');
    return;
  }

  const serverBuildPath = path.join(app.getAppPath(), 'build/server/index.js');
  console.log(`Loading server build... path is ${serverBuildPath}`);

  try {
    const fileUrl = pathToFileURL(serverBuildPath).href;
    const serverBuild: ServerBuild = /** @type {ServerBuild} */ await import(fileUrl);
    console.log('Server build loaded successfully');

    // eslint-disable-next-line consistent-return
    return serverBuild;
  } catch (buildError) {
    console.log('Failed to load server build:', {
      message: (buildError as Error)?.message,
      stack: (buildError as Error)?.stack,
      error: JSON.stringify(buildError, Object.getOwnPropertyNames(buildError as object)),
    });

    return;
  }
}

(async () => {
  await app.whenReady();
  console.log('App is ready');

  // Load any existing cookies from ElectronStore, set as cookie
  await initCookies();

  const serverBuild = await loadServerBuild();

  protocol.handle('http', async (req) => {
    console.log('Handling request for:', req.url);

    if (isDev) {
      console.log('Dev mode: forwarding to vite server');
      return await fetch(req);
    }

    req.headers.append('Referer', req.referrer);

    try {
      const url = new URL(req.url);

      // Forward requests to specific local server ports
      if (url.port !== `${DEFAULT_PORT}`) {
        console.log('Forwarding request to local server:', req.url);
        return await fetch(req);
      }

      // Always try to serve asset first
      const res = await serveAsset(req, rendererClientPath);

      if (res) {
        console.log('Served asset:', req.url);
        return res;
      }

      // Forward all cookies to remix server
      const cookies = await session.defaultSession.cookies.get({});

      if (cookies.length > 0) {
        req.headers.set('Cookie', cookies.map((c) => `${c.name}=${c.value}`).join('; '));

        // Store all cookies
        await storeCookies();
      }

      // Create request handler with the server build
      const handler = createRequestHandler(serverBuild, 'production');
      console.log('Handling request with server build:', req.url);

      const result = await handler(req, {
        /*
         * Remix app access cloudflare.env
         * Need to pass an empty object to prevent undefined
         */
        // @ts-ignore:next-line
        cloudflare: {},
      });

      return result;
    } catch (err) {
      console.log('Error handling request:', {
        url: req.url,
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
                cause: err.cause,
              }
            : err,
      });

      const { stack, message } = toError(err);

      return new Response(`Error handling request to ${req.url}: ${stack ?? message}`, {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });
    }
  });

  const rendererURL = await (isDev
    ? (async () => {
        await initViteServer();

        if (!viteServer) {
          throw new Error('Vite server is not initialized');
        }

        const listen = await viteServer.listen();
        global.__electron__ = electron;
        viteServer.printUrls();

        return `http://localhost:${listen.config.server.port}`;
      })()
    : `http://localhost:${DEFAULT_PORT}`);

  console.log('Using renderer URL:', rendererURL);

  const win = await createWindow(rendererURL);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(rendererURL);
    }
  });

  console.log('end whenReady');

  return win;
})()
  .then((win) => {
    // IPC samples : send and recieve.
    let count = 0;
    setInterval(() => win.webContents.send('ping', `hello from main! ${count++}`), 60 * 1000);
    ipcMain.handle('ipcTest', (event, ...args) => console.log('ipc: renderer -> main', { event, ...args }));

    return win;
  })
  .then((win) => setupMenu(win));

/*
 *
 * Menu: append Go -> Back, Forward
 *
 */
const setupMenu = (win: BrowserWindow): void => {
  const app = Menu.getApplicationMenu();
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(app ? app.items : []),
      {
        label: 'Go',
        submenu: [
          {
            label: 'Back',
            accelerator: 'CmdOrCtrl+[',
            click: () => {
              win?.webContents.navigationHistory.goBack();
            },
          },
          {
            label: 'Forward',
            accelerator: 'CmdOrCtrl+]',
            click: () => {
              win?.webContents.navigationHistory.goForward();
            },
          },
        ],
      },
    ]),
  );
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/*
 *
 * take care of vite-dev-server.
 *
 */
app.on('before-quit', async (_event) => {
  if (!viteServer) {
    return;
  }

  /*
   * ref: https://stackoverflow.com/questions/68750716/electron-app-throwing-quit-unexpectedly-error-message-on-mac-when-quitting-the-a
   * event.preventDefault();
   */
  try {
    console.log('will close vite-dev-server.');
    await viteServer.close();
    console.log('closed vite-dev-server.');

    // app.quit(); // Not working. causes recursively 'before-quit' events.
    app.exit(); // Not working expectedly SOMETIMES. Still throws exception and macOS shows dialog.
    // global.process.exit(0); // Not working well... I still see exceptional dialog.
  } catch (err) {
    console.log('failed to close Vite server:', err);
  }
});

// serve assets built by vite.
export async function serveAsset(req: Request, assetsPath: string): Promise<Response | undefined> {
  const url = new URL(req.url);
  const fullPath = path.join(assetsPath, decodeURIComponent(url.pathname));
  console.log('Serving asset, path:', fullPath);

  if (!fullPath.startsWith(assetsPath)) {
    console.log('Path is outside assets directory:', fullPath);
    return;
  }

  const stat = await fs.stat(fullPath).catch((err) => {
    console.log('Failed to stat file:', fullPath, err);
    return undefined;
  });

  if (!stat?.isFile()) {
    console.log('Not a file:', fullPath);
    return;
  }

  const headers = new Headers();
  const mimeType = mime.getType(fullPath);

  if (mimeType) {
    headers.set('Content-Type', mimeType);
  }

  console.log('Serving file with mime type:', mimeType);

  const body = createReadableStreamFromReadable(createReadStream(fullPath));

  // eslint-disable-next-line consistent-return
  return new Response(body, { headers });
}

function toError(value: unknown) {
  return value instanceof Error ? value : new Error(String(value));
}

// Reload on change.
let isQuited = false;

const abort = new AbortController();
const { signal } = abort;

(async () => {
  const dir = path.join(__dirname, '../../build/electron');

  try {
    const watcher = fs.watch(dir, { signal, recursive: true });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _event of watcher) {
      if (!isQuited) {
        isQuited = true;
        app.relaunch();
        app.quit();
      }
    }
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }

    if (err.name === 'AbortError') {
      console.log('abort watching:', dir);
      return;
    }
  }
})();

setupAutoUpdater();
