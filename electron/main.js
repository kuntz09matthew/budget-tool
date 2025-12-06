const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
let downloadProgressWindow = null;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user choose
autoUpdater.autoInstallOnAppQuit = false; // Don't auto-install, let user choose
autoUpdater.allowDowngrade = false; // Only allow upgrades
autoUpdater.allowPrerelease = false; // Only stable releases

// Enable differential downloads (smart binary diff downloads)
// This will automatically use .nsis.7z differential packages when available
const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Additional logging configuration
log.info('App starting...');
log.info('Version:', app.getVersion());
log.info('Update feed URL:', autoUpdater.getFeedURL());

// Start the Python Flask server
function startServer() {
  try {
    // In production, server files are unpacked to app.asar.unpacked
    const isPackaged = app.isPackaged;
    const serverPath = isPackaged 
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server', 'app.py')
      : path.join(__dirname, '../server/app.py');
    
    // Check for bundled Python first, then system Python
    let pythonCommand;
    const bundledPython = path.join(process.resourcesPath, 'python', 'python.exe');
    
    if (require('fs').existsSync(bundledPython)) {
      pythonCommand = bundledPython;
      console.log('Using bundled Python');
      console.log('Server path:', serverPath);
    } else {
      pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      console.log('Using system Python');
    }
    
    // Set the correct working directory for the server
    const serverDir = isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server')
      : path.join(__dirname, '../server');
    
    console.log('Working directory:', serverDir);
    
    serverProcess = spawn(pythonCommand, [serverPath], {
      stdio: 'pipe',
      cwd: serverDir,
      shell: false
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Python: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start Python server:', err);
      console.log('App will run in frontend-only mode');
      serverProcess = null;
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`Python server exited with code ${code}`);
    });
    
    console.log('Python Flask server starting...');
  } catch (err) {
    console.error('Could not start server:', err);
    console.log('App will run in frontend-only mode');
  }
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

  // Try to load from Flask server first, fallback to local file
  const serverUrl = 'http://localhost:5000';
  const localFile = `file://${path.join(__dirname, '../frontend/index.html')}`;
  
  // Try server, fallback to local file after 3 seconds
  mainWindow.loadURL(serverUrl).catch(() => {
    console.log('Flask server not available, loading local file');
    mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'));
  });
  
  // Fallback if server doesn't respond
  setTimeout(() => {
    if (!mainWindow.webContents.getURL().includes('localhost:5000')) {
      console.log('Server timeout, loading local file');
      mainWindow.loadFile(path.join(__dirname, '../frontend/index.html'));
    }
  }, 3000);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Check for updates after window loads
  mainWindow.webContents.on('did-finish-load', () => {
    // Check for updates 3 seconds after app loads (always check, even in dev)
    setTimeout(() => {
      console.log('Initiating update check...');
      autoUpdater.checkForUpdates().catch(err => {
        console.error('Update check failed:', err);
      });
    }, 3000);
  });
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  console.log('Update info:', JSON.stringify(info, null, 2));
  
  // Send update info to renderer
  mainWindow.webContents.send('update-available', {
    version: info.version,
    releaseNotes: info.releaseNotes,
    releaseDate: info.releaseDate
  });
  
  // Calculate download size
  const downloadSize = info.files && info.files[0] ? info.files[0].size : null;
  const sizeInMB = downloadSize ? (downloadSize / 1024 / 1024).toFixed(2) : 'Unknown';
  
  // Show dialog to user with size info
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available!`,
    detail: `Download size: ${sizeInMB} MB\n\nWould you like to download and install the update?`,
    buttons: ['Download & Install', 'Later'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      // User chose to download
      console.log('Starting download...');
      
      // Send downloading event to renderer (progress will show in UI)
      mainWindow.webContents.send('update-downloading');
      
      // Show non-blocking notification
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Downloading Update',
        message: 'Download started',
        detail: `Size: ${sizeInMB} MB\n\nProgress will be shown in the taskbar and at the top of the window.`,
        buttons: ['OK']
      });
      
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('No updates available');
  console.log('Current version is up to date:', info.version);
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  console.error('Error stack:', err.stack);
  
  // Clear progress bar
  if (mainWindow && process.platform === 'win32') {
    mainWindow.setProgressBar(-1);
  }
  
  mainWindow.webContents.send('update-error', err.message);
  
  // Show error to user
  dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: 'Update Error',
    message: 'Failed to download update',
    detail: `Error: ${err.message}\n\nPlease check your internet connection and try again later.`,
    buttons: ['OK']
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  const transferredMB = (progressObj.transferred / 1024 / 1024).toFixed(2);
  const totalMB = (progressObj.total / 1024 / 1024).toFixed(2);
  const bytesPerSecond = progressObj.bytesPerSecond || 0;
  const speedMB = (bytesPerSecond / 1024 / 1024).toFixed(2);
  
  console.log(`Download progress: ${percent}% (${transferredMB}/${totalMB} MB) @ ${speedMB} MB/s`);
  
  // Update window progress bar (Windows only)
  if (mainWindow && process.platform === 'win32') {
    mainWindow.setProgressBar(progressObj.percent / 100);
  }
  
  mainWindow.webContents.send('update-download-progress', {
    percent: percent,
    transferred: progressObj.transferred,
    total: progressObj.total,
    transferredMB: transferredMB,
    totalMB: totalMB,
    speedMB: speedMB
  });
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded successfully!');
  console.log('Downloaded version:', info.version);
  
  // Clear progress bar
  if (mainWindow && process.platform === 'win32') {
    mainWindow.setProgressBar(-1);
  }
  
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
      console.log('Restarting to install update...');
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
  // Wait 2 seconds for Flask server to start, then open window
  // Window will fallback to local files if server isn't ready
  setTimeout(createWindow, 2000);
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
