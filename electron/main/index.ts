/// <reference types="vite/client" />
import { createRequestHandler } from '@remix-run/node';
import electron, { app, BrowserWindow, ipcMain, protocol, session, dialog, shell } from 'electron';
import log from 'electron-log';
import path from 'node:path';
import fs from 'node:fs/promises';
import * as pkg from '../../package.json';
import { setupAutoUpdater } from './utils/auto-update';
import { isDev, DEFAULT_PORT } from './utils/constants';
import { initViteServer, viteServer } from './utils/vite-server';
import { setupMenu } from './ui/menu';
import { createWindow } from './ui/window';
import { initCookies, storeCookies } from './utils/cookie';
import { loadServerBuild, serveAsset } from './utils/serve';
import { reloadOnChange } from './utils/reload';
import { autoUpdater } from 'electron';

Object.assign(console, log.functions);

console.debug('main: import.meta.env:', import.meta.env);
console.log('main: isDev:', isDev);
console.log('NODE_ENV:', global.process.env.NODE_ENV);
console.log('isPackaged:', app.isPackaged);

// Log unhandled errors
process.on('uncaughtException', async (error) => {
  console.log('Uncaught Exception:', error);
});

process.on('unhandledRejection', async (error) => {
  console.log('Unhandled Rejection:', error);
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

  app.setAppLogsPath(path.join(root, subdirName, 'Logs'));
})();

console.log('appPath:', app.getAppPath());

const keys: Parameters<typeof app.getPath>[number][] = ['home', 'appData', 'userData', 'sessionData', 'logs', 'temp'];
keys.forEach((key) => console.log(`${key}:`, app.getPath(key)));
console.log('start whenReady');

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/naming-convention
  var __electron__: typeof electron;
}

// 添加IPC处理程序
function setupIpcHandlers(win: BrowserWindow) {
  // 处理打开文件对话框
  ipcMain.handle('open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(win, options);
    return result.filePaths;
  });

  // 处理保存文件对话框
  ipcMain.handle('save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(win, options);
    return result.filePath;
  });

  // 处理保存文件内容
  ipcMain.handle('save-file', async (event, { filePath, content }) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('保存文件失败:', error);
      return { success: false, error: String(error) };
    }
  });

  // 处理读取文件内容
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      console.error('读取文件失败:', error);
      return { success: false, error: String(error) };
    }
  });

  // 处理打开外部链接
  ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
    return true;
  });

  // 获取应用信息
  ipcMain.handle('get-app-info', () => {
    return {
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform,
    };
  });

  // 导出PDF
  ipcMain.handle('export-pdf', async () => {
    try {
      // 打开保存对话框
      const saveResult = await dialog.showSaveDialog(win, {
        title: '导出为PDF',
        defaultPath: `对话记录_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`,
        filters: [{ name: 'PDF文件', extensions: ['pdf'] }],
      });

      if (!saveResult.filePath) {
        return { success: false, error: '用户取消' };
      }

      // 打印设置
      const printOptions = {
        marginsType: 0,
        pageSize: 'A4' as const,
        printBackground: true,
        printSelectionOnly: false,
        landscape: false,
      };

      // 生成PDF数据
      const data = await win.webContents.printToPDF(printOptions);

      // 保存PDF文件
      await fs.writeFile(saveResult.filePath, data);

      return { success: true };
    } catch (error) {
      console.error('PDF导出失败:', error);
      return { success: false, error: String(error) };
    }
  });

  // 处理导入对话
  ipcMain.handle('import-chat', async (event, { description, messages }) => {
    try {
      // 将消息传递给渲染进程
      win.webContents.send('import-chat-data', { description, messages });
      return { success: true };
    } catch (error) {
      console.error('导入对话失败:', error);
      return { success: false, error: String(error) };
    }
  });

  // 检查更新
  ipcMain.handle('check-for-updates', async () => {
    // 这里应该接入实际的更新检查逻辑

    try {
      const updateCheckResult = await autoUpdater.checkForUpdates();

      if (updateCheckResult == null) {
        return {
          hasUpdate: false,
          version: app.getVersion(),
          currentVersion: app.getVersion(),
        };
      }

      // 断言updateCheckResult有updateInfo属性
      const updateInfo = (updateCheckResult as any).updateInfo;

      return {
        hasUpdate: updateInfo?.version !== app.getVersion(),
        version: updateInfo?.version ?? app.getVersion(),
        currentVersion: app.getVersion(),
        releaseDate: updateInfo?.releaseDate,
      };
    } catch (error) {
      console.error('检查更新失败:', error);
      return {
        hasUpdate: false,
        version: app.getVersion(),
        currentVersion: app.getVersion(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
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
      const assetPath = path.join(app.getAppPath(), 'build', 'client');
      const res = await serveAsset(req, assetPath);

      if (res) {
        console.log('Served asset:', req.url);
        return res;
      }

      // Forward all cookies to remix server
      const cookies = await session.defaultSession.cookies.get({});

      if (cookies.length > 0) {
        req.headers.set('Cookie', cookies.map((c) => `${c.name}=${c.value}`).join('; '));

        // Store all cookies
        await storeCookies(cookies);
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

      const error = err instanceof Error ? err : new Error(String(err));

      return new Response(`Error handling request to ${req.url}: ${error.stack ?? error.message}`, {
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

    // 设置IPC处理程序
    setupIpcHandlers(win);

    return win;
  })
  .then((win) => setupMenu(win));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

reloadOnChange();
setupAutoUpdater();
