const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user choose
autoUpdater.autoInstallOnAppQuit = false; // Don't auto-install, let user choose

// Start the Python Flask server
function startServer() {
  const serverPath = path.join(__dirname, '../server/app.py');
  
  // Use python or python3 depending on system
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  serverProcess = spawn(pythonCommand, [serverPath], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '../server')
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start Python server:', err);
  });
  
  console.log('Python Flask server starting...');
}

// Stop the Express server
function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // Load the frontend (served by Flask)
  const startUrl = 'http://localhost:5000';
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Check for updates after window loads (only in production)
  if (process.env.NODE_ENV !== 'development') {
    mainWindow.webContents.on('did-finish-load', () => {
      // Check for updates 2 seconds after app loads
      setTimeout(() => {
        autoUpdater.checkForUpdates();
      }, 2000);
    });
  }
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  
  // Send update info to renderer
  mainWindow.webContents.send('update-available', {
    version: info.version,
    releaseNotes: info.releaseNotes,
    releaseDate: info.releaseDate
  });
  
  // Show dialog to user
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available!`,
    detail: 'Would you like to download and install the update?',
    buttons: ['Download & Install', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      // User chose to download
      autoUpdater.downloadUpdate();
      mainWindow.webContents.send('update-downloading');
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('No updates available');
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  mainWindow.webContents.send('update-error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Download progress: ${progressObj.percent}%`);
  mainWindow.webContents.send('update-download-progress', {
    percent: progressObj.percent,
    transferred: progressObj.transferred,
    total: progressObj.total
  });
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  
  // Send notification to renderer
  mainWindow.webContents.send('update-downloaded', {
    version: info.version
  });
  
  // Show dialog to user
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded successfully!',
    detail: 'The application will restart to install the update.',
    buttons: ['Restart Now', 'Restart Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      // User chose to restart
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });
});

// IPC handlers
ipcMain.on('check-for-updates', () => {
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdates();
  }
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

app.on('ready', () => {
  startServer();
  // Wait for Flask server to start
  setTimeout(createWindow, 3000);
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopServer();
});
