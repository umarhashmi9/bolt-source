import { app, BrowserWindow, ipcMain, session, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === 'development'
const DEV_SERVER_URL = 'http://localhost:5173'

let mainWindow: BrowserWindow | null = null

// Function to wait for dev server to be ready
async function waitForDevServer(url: string, maxAttempts = 30): Promise<boolean> {
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch (err) {
      console.log(`Waiting for dev server... attempt ${attempt + 1}/${maxAttempts}`)
      await wait(1000)
    }
  }
  return false
}

async function createWindow(): Promise<void> {
  // Set up security policies for WebContainers and local services
  await session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      'clipboard-read',
      'clipboard-write',
      'media',
      'display-capture',
      'mediaKeySystem',
      'geolocation',
      'notifications',
      'midi',
      'midiSysex',
      'pointerLock',
      'fullscreen',
      'openExternal'
    ]
    callback(allowedPermissions.includes(permission))
  })

  // Set CSP and CORS headers
  await session.defaultSession.webRequest.onHeadersReceived(({ responseHeaders, url }, callback) => {
    const newHeaders = { ...responseHeaders }
    
    // Remove existing CSP headers
    delete newHeaders['content-security-policy']
    delete newHeaders['content-security-policy-report-only']
    
    // Set single CORS headers
    if (isDev) {
      newHeaders['access-control-allow-origin'] = ['*']
      newHeaders['access-control-allow-methods'] = ['GET, POST, PUT, DELETE, OPTIONS']
      newHeaders['access-control-allow-headers'] = ['Content-Type, Authorization']
    }

    callback({ 
      responseHeaders: {
        ...newHeaders,
        'content-security-policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: ws: wss: http: https: localhost:*;"
        ]
      } 
    })
  })

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'transparent',
      symbolColor: '#fff',
      height: 28
    },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: isDev,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      sandbox: false
    }
  })

  mainWindow.setBackgroundColor('#00000000')

  // Load the app
  if (isDev) {
    try {
      const serverReady = await waitForDevServer(DEV_SERVER_URL)
      if (!serverReady) {
        throw new Error('Dev server not available after maximum attempts')
      }
      await mainWindow.loadURL(DEV_SERVER_URL)
      // Only open dev tools if ELECTRON_DEV_TOOLS is set
      if (process.env.ELECTRON_DEV_TOOLS === 'true') {
        mainWindow.webContents.openDevTools()
      }
    } catch (error) {
      console.error('Failed to load dev server:', error)
      app.quit()
    }
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../build/client/index.html'))
  }

  // Inject styles after the window is loaded
  mainWindow.webContents.on('did-finish-load', async () => {
    try {
      // In development, read from source
      const stylesPath = isDev 
        ? path.join(__dirname, '..', 'electron', 'styles.css')
        : path.join(__dirname, 'styles.css')
      
      const css = await fs.readFile(stylesPath, 'utf8')
      await mainWindow?.webContents.insertCSS(css)
      console.log('Styles injected successfully')
    } catch (error) {
      console.error('Failed to inject styles:', error)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Validate file path for security
function isPathSafe(filePath: string): boolean {
  // Normalize the path to prevent directory traversal attacks
  const normalizedPath = path.normalize(filePath)
  
  // Get the user's home directory as the base allowed path
  const userHome = app.getPath('home')
  const allowedPaths = [
    userHome,
    app.getPath('documents'),
    app.getPath('downloads')
  ]

  // Check if the path is within allowed directories
  return allowedPaths.some(allowedPath => 
    normalizedPath.startsWith(allowedPath) && !normalizedPath.includes('..')
  )
}

// Handle file system operations
ipcMain.handle('read-file', async (event, filePath: string) => {
  try {
    // Security validation
    if (!isPathSafe(filePath)) {
      throw new Error('Access denied: File path is not allowed')
    }

    // Check if file exists
    await fs.access(filePath)
    
    // Read file
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (error) {
    console.error('Error reading file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
})

ipcMain.handle('write-file', async (event, filePath: string, content: string) => {
  try {
    // Security validation
    if (!isPathSafe(filePath)) {
      throw new Error('Access denied: File path is not allowed')
    }

    // Ensure directory exists
    const directory = path.dirname(filePath)
    await fs.mkdir(directory, { recursive: true })

    // Write file
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error writing file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
})

// Add file dialog handlers
ipcMain.handle('show-open-dialog', async () => {
  if (!mainWindow) return { canceled: true }

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

ipcMain.handle('show-save-dialog', async () => {
  if (!mainWindow) return { canceled: true }

  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result
})

// Window control handlers
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
