import { BrowserWindow, Menu, app } from 'electron';

export function setupMenu(win: BrowserWindow): void {
  // 创建完全自定义的菜单，替换默认菜单
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: '文件',
        submenu: [
          {
            label: '新建',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              win?.webContents.send('menu-action', 'new-file');
            },
          },
          {
            label: '打开',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              win?.webContents.send('menu-action', 'open-file');
            },
          },
          { type: 'separator' },
          {
            label: '保存',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              win?.webContents.send('menu-action', 'save-file');
            },
          },
          {
            label: '另存为...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => {
              win?.webContents.send('menu-action', 'save-as-file');
            },
          },
          { type: 'separator' },
          {
            label: '导出对话',
            submenu: [
              {
                label: 'JSON格式',
                click: () => {
                  win?.webContents.send('menu-action', 'export-json');
                },
              },
              {
                label: 'HTML格式',
                click: () => {
                  win?.webContents.send('menu-action', 'export-html');
                },
              },
              {
                label: 'PDF格式',
                click: () => {
                  win?.webContents.send('menu-action', 'export-pdf');
                },
              },
            ],
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          { role: 'delete', label: '删除' },
          { type: 'separator' },
          { role: 'selectAll', label: '全选' },
          { type: 'separator' },
          {
            label: '查找',
            accelerator: 'CmdOrCtrl+F',
            click: () => {
              win?.webContents.send('menu-action', 'find');
            },
          },
          {
            label: '替换',
            accelerator: 'CmdOrCtrl+H',
            click: () => {
              win?.webContents.send('menu-action', 'replace');
            },
          },
        ],
      },
      {
        label: '导航',
        submenu: [
          {
            label: '后退',
            accelerator: 'CmdOrCtrl+[',
            click: () => {
              win?.webContents.navigationHistory.goBack();
            },
          },
          {
            label: '前进',
            accelerator: 'CmdOrCtrl+]',
            click: () => {
              win?.webContents.navigationHistory.goForward();
            },
          },
          {
            label: '刷新',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              win?.webContents.reload();
            },
          },
          { type: 'separator' },
          {
            label: '首页',
            accelerator: 'Alt+Home',
            click: () => {
              win?.webContents.send('menu-action', 'go-home');
            },
          },
        ],
      },
      {
        label: '视图',
        submenu: [
          { role: 'resetZoom', label: '重置缩放' },
          { role: 'zoomIn', label: '放大', accelerator: 'CmdOrCtrl+=' },
          { role: 'zoomOut', label: '缩小' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: '全屏' },
          { type: 'separator' },
          {
            label: '开发者工具',
            accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click: () => {
              win?.webContents.toggleDevTools();
            },
          },
        ],
      },
      {
        label: '工具',
        submenu: [
          {
            label: '设置',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              win?.webContents.send('menu-action', 'open-settings');
            },
          },
          { type: 'separator' },
          {
            label: '清除历史记录',
            click: () => {
              win?.webContents.send('menu-action', 'clear-history');
            },
          },
          {
            label: '清除缓存',
            click: () => {
              win?.webContents.session.clearCache().then(() => {
                win?.webContents.send('menu-action', 'cache-cleared');
              });
            },
          },
        ],
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '文档',
            click: () => {
              win?.webContents.send('menu-action', 'open-docs');
            },
          },
          {
            label: '检查更新',
            click: () => {
              win?.webContents.send('menu-action', 'check-updates');
            },
          },
          { type: 'separator' },
          {
            label: '关于',
            click: () => {
              win?.webContents.send('menu-action', 'show-about');
            },
          },
        ],
      },
    ]),
  );
}
