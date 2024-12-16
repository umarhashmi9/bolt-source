/// <reference types="vite/client" />
import {
  createReadableStreamFromReadable,
  createRequestHandler,
} from "@remix-run/node";
import electron, {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  protocol,
} from "electron";
import log from "electron-log"; // write logs into ${app.getPath("logs")}/main.log without `/main`.
import ElectronStore from "electron-store";
import mime from "mime";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { createServer } from "vite";
import type { ViteDevServer } from "vite";
import * as pkg from "../../package.json";
import { setupAutoUpdater } from "./auto-update";
// log.initialize(); // inject a built-in preload script. https://github.com/megahertz/electron-log/blob/master/docs/initialize.md
Object.assign(console, log.functions);

console.debug("main: import.meta.env:", import.meta.env);

const __dirname = fileURLToPath(import.meta.url);
const isDev = !(global.process.env.NODE_ENV === "production" || app.isPackaged);

// Set up logging
const logFile = path.join(app.getPath('userData'), 'electron-app.log');

async function appLogger(...args: any[]) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');

  if (isDev) {
    console.log(message);
  } else {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    await fs.appendFile(logFile, logMessage);
  }
}

appLogger("main: isDev:", isDev);
appLogger("NODE_ENV:", global.process.env.NODE_ENV);
appLogger("isPackaged:", app.isPackaged);

// Log unhandled errors
process.on('uncaughtException', async (error) => {
  await appLogger('Uncaught Exception:', error);
});

process.on('unhandledRejection', async (error) => {
  await appLogger('Unhandled Rejection:', error);
});

(() => {
  const root =
    global.process.env.APP_PATH_ROOT ?? import.meta.env.VITE_APP_PATH_ROOT;
  if (root === undefined) {
    appLogger(
      "no given APP_PATH_ROOT or VITE_APP_PATH_ROOT. default path is used."
    );
    return;
  }
  if (!path.isAbsolute(root)) {
    appLogger("APP_PATH_ROOT must be absolute path.");
    global.process.exit(1);
  }

  appLogger(`APP_PATH_ROOT: ${root}`);
  const subdirName = pkg.name;
  for (const [key, val] of [
    ["appData", ""],
    ["userData", subdirName],
    ["sessionData", subdirName],
  ] as const) {
    app.setPath(key, path.join(root, val));
  }

  app.setAppLogsPath(path.join(root, `${subdirName}/Logs`));
})();

appLogger("appPath:", app.getAppPath());
const keys: Parameters<typeof app.getPath>[number][] = [
  "home",
  "appData",
  "userData",
  "sessionData",
  "logs",
  "temp",
];
keys.forEach((key) => appLogger(`${key}:`, app.getPath(key)));

const store = new ElectronStore<any>({ encryptionKey: "something" });

const createWindow = async (rendererURL: string) => {
  appLogger('Creating window with URL:', rendererURL);
  const bounds = store.get("bounds");
  appLogger("restored bounds:", bounds);

  const win = new BrowserWindow({
    ...{
      width: 1200,
      height: 800,
      ...bounds,
    },
    vibrancy: "under-window",
    visualEffectState: "active",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
    },
  });

  appLogger('Window created, loading URL...');
  win.loadURL(rendererURL).catch((err) => {
    appLogger('Failed to load URL:', err);
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    appLogger('Failed to load:', errorCode, errorDescription);
  });

  win.webContents.on('did-finish-load', () => {
    appLogger('Window finished loading');
  });

  // Open devtools in development
  if (isDev) {
    win.webContents.openDevTools();
  }

  const boundsListener = () => {
    const bounds = win.getBounds();
    store.set("bounds", bounds);
  };
  win.on("moved", boundsListener);
  win.on("resized", boundsListener);

  return win;
};

appLogger("start whenReady");
const rendererClientPath = isDev 
  ? path.join(__dirname, "../../client")
  : path.join(app.getAppPath(), "build/client");
let viteServer: ViteDevServer;

declare global {
  var __electron__: typeof electron;
}

(async () => {
  await app.whenReady();
  appLogger('App is ready');
  
  let serverBuild: any = null;
  try {
    serverBuild = isDev
      ? null // serverBuild is not used in dev.
      : await import(path.join(app.getAppPath(), "build/server/index.js"));
    appLogger('Server build loaded successfully');
  } catch (err) {
    appLogger('Failed to load server build:', err);
  }

  appLogger('Setting up protocol handler...');
  protocol.handle("http", async (req) => {
    const url = new URL(req.url);
    appLogger('Handling request for:', req.url);
    
    if (
      !["localhost", "127.0.0.1"].includes(url.hostname) ||
      (url.port && url.port !== "8080")
    ) {
      appLogger('Forwarding external request to fetch:', req.url);
      return await fetch(req);
    }

    req.headers.append("Referer", req.referrer);
    try {
      const res = await serveAsset(req, rendererClientPath);
      if (res) {
        appLogger('Served asset:', req.url);
        return res;
      }

      if (!serverBuild) {
        appLogger('No server build available, returning 404');
        return new Response('Not Found', { status: 404 });
      }

      appLogger('Creating request handler for:', req.url);
      const handler = createRequestHandler(serverBuild, "production");
      // @ts-ignore -- Electron environment doesn't need full context
      return await handler(req, {
        /* context */
      });
    } catch (err) {
      appLogger('Error handling request:', err);
      const { stack, message } = toError(err);
      return new Response(`${stack ?? message}`, {
        status: 500,
        headers: { "content-type": "text/html" },
      });
    }
  });

  const rendererURL = await (isDev
    ? (async () => {
        viteServer = await createServer({
          root: ".",
          envDir: path.join(__dirname, "../.."), // load .env files from the root directory.
        });
        const listen = await viteServer.listen();
        global.__electron__ = electron;
        viteServer.printUrls();
        return `http://localhost:${listen.config.server.port}`;
      })()
    : "http://localhost:8080");

  appLogger('Using renderer URL:', rendererURL);
  const win = await createWindow(rendererURL);

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow(rendererURL);
    }
  });

  appLogger("end whenReady");
  return win;
})()
  .then((win) => {
    // IPC samples : send and recieve.
    let count = 0;
    setInterval(
      () => win.webContents.send("ping", `hello from main! ${count++}`),
      60 * 1000
    );
    ipcMain.handle("ipcTest", (event, ...args) =>
      appLogger("ipc: renderer -> main", { event, ...args })
    );
    return win;
  })
  .then((win) => setupMenu(win));

//
// Menu: append Go -> Back, Forward
//
const setupMenu = (win: BrowserWindow): void => {
  const app = Menu.getApplicationMenu();
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(app ? app.items : []),
      {
        label: "Go",
        submenu: [
          {
            label: "Back",
            accelerator: "CmdOrCtrl+[",
            click: () => {
              win?.webContents.navigationHistory.goBack();
            },
          },
          {
            label: "Forward",
            accelerator: "CmdOrCtrl+]",
            click: () => {
              win?.webContents.navigationHistory.goForward();
            },
          },
        ],
      },
    ])
  );
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

//
// take care of vite-dev-server.
//
app.on("before-quit", async (_event) => {
  if (!viteServer) {
    return;
  }
  // ref: https://stackoverflow.com/questions/68750716/electron-app-throwing-quit-unexpectedly-error-message-on-mac-when-quitting-the-a
  // event.preventDefault();
  try {
    appLogger("will close vite-dev-server.");
    await viteServer.close();
    appLogger("closed vite-dev-server.");
    // app.quit(); // Not working. causes recursively 'before-quit' events.
    app.exit(); // Not working expectedly SOMETIMES. Still throws exception and macOS shows dialog.
    // global.process.exit(0); // Not working well... I still see exceptional dialog.
  } catch (err) {
    appLogger("failed to close Vite server:", err);
  }
});

// serve assets built by vite.
export async function serveAsset(
  req: Request,
  assetsPath: string
): Promise<Response | undefined> {
  const url = new URL(req.url);
  const fullPath = path.join(assetsPath, decodeURIComponent(url.pathname));
  appLogger('Serving asset, path:', fullPath);
  
  if (!fullPath.startsWith(assetsPath)) {
    appLogger('Path is outside assets directory:', fullPath);
    return;
  }

  const stat = await fs.stat(fullPath).catch((err) => {
    appLogger('Failed to stat file:', fullPath, err);
    return undefined;
  });
  
  if (!stat?.isFile()) {
    appLogger('Not a file:', fullPath);
    return;
  }

  const headers = new Headers();
  const mimeType = mime.getType(fullPath);
  if (mimeType) {
    headers.set("Content-Type", mimeType);
  }
  appLogger('Serving file with mime type:', mimeType);

  const body = createReadableStreamFromReadable(createReadStream(fullPath));
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
  const dir = path.join(__dirname, "../../build/electron");
  try {
    const watcher = fs.watch(dir, { signal, recursive: true });
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
    if (err.name === "AbortError") {
      appLogger("abort watching:", dir);
      return;
    }
  }
})();

setupAutoUpdater();