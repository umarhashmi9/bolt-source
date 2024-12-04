import { contextBridge, ipcRenderer } from 'electron'

// Create and inject the titlebar region
const injectTitlebarRegion = () => {
  // Remove any existing titlebar
  const existing = document.querySelector('.titlebar-region')
  if (existing && existing.parentElement) {
    existing.parentElement.removeChild(existing)
  }

  // Create new titlebar
  const titlebar = document.createElement('div')
  titlebar.className = 'titlebar-region'
  
  // Add to document
  if (document.body) {
    document.body.insertBefore(titlebar, document.body.firstChild)
  }
}

// Try to inject the titlebar
const init = () => {
  injectTitlebarRegion()
  // Retry after a short delay to ensure it's added
  setTimeout(injectTitlebarRegion, 100)
}

// Add listeners for injection
document.addEventListener('DOMContentLoaded', init)
window.addEventListener('load', init)

interface FileOperationResult {
  success: boolean
  content?: string
  error?: string
}

interface FileDialogResult {
  canceled: boolean
  filePaths?: string[]
  filePath?: string
}

interface ElectronAPI {
  platform: string
  isElectron: boolean
  // File operations
  readFile: (path: string) => Promise<FileOperationResult>
  writeFile: (path: string, content: string) => Promise<FileOperationResult>
  // File dialogs
  showOpenDialog: () => Promise<FileDialogResult>
  showSaveDialog: () => Promise<FileDialogResult>
  // Window operations
  minimize: () => void
  maximize: () => void
  close: () => void
}

// Expose the typed API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,
  // File system operations
  readFile: (path: string) => ipcRenderer.invoke('read-file', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', path, content),
  // File dialogs
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  // Window operations
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
} as ElectronAPI)

export {} // Make this file a module

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
