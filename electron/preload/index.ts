import { ipcRenderer, contextBridge, type IpcRendererEvent } from 'electron';

console.debug('start preload.', ipcRenderer);

// IPC Communication Interface
const ipc = {
  invoke(...args: any[]) {
    return ipcRenderer.invoke('ipcTest', ...args);
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(channel: string, func: Function) {
    const f = (event: IpcRendererEvent, ...args: any[]) => func(...[event, ...args]);
    console.debug('register listener', channel, f);
    ipcRenderer.on(channel, f);

    return () => {
      console.debug('remove listener', channel, f);
      ipcRenderer.removeListener(channel, f);
    };
  },
};

// Internationalization Related Functions
const i18n = {
  // Get system locale
  getSystemLocale: () => {
    return ipcRenderer.invoke('getSystemLocale');
  },

  // Store language settings
  setLanguage: (language: string) => {
    return ipcRenderer.invoke('setLanguage', language);
  },

  // Get stored language settings
  getLanguage: () => {
    return ipcRenderer.invoke('getLanguage');
  },
};

// Expose interfaces to renderer process
contextBridge.exposeInMainWorld('ipc', ipc);
contextBridge.exposeInMainWorld('electronI18n', i18n);
