const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

let mainWindow = null;
const stateFilePath = path.join(app.getPath('userData'), 'deskflow-window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load window state:', err);
  }
  return { width: 380, height: 720, x: undefined, y: undefined, alwaysOnTop: true };
}

function saveWindowState() {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    const alwaysOnTop = mainWindow.isAlwaysOnTop();
    fs.writeFileSync(stateFilePath, JSON.stringify({ ...bounds, alwaysOnTop }));
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

// Helper to compute CPU usage across intervals
let previousCpuInfo = os.cpus();
function getCpuUsage() {
  const currentCpuInfo = os.cpus();
  let idleDifference = 0;
  let totalDifference = 0;

  for (let i = 0; i < currentCpuInfo.length; i++) {
    const prev = previousCpuInfo[i] ? previousCpuInfo[i].times : { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };
    const curr = currentCpuInfo[i].times;

    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;

    idleDifference += curr.idle - prev.idle;
    totalDifference += currTotal - prevTotal;
  }

  previousCpuInfo = currentCpuInfo;
  if (totalDifference === 0) return 15; // default fallback percentage
  const usage = 100 - Math.round((100 * idleDifference) / totalDifference);
  return Math.min(100, Math.max(0, usage));
}

function createWindow() {
  const savedState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: savedState.width || 380,
    height: savedState.height || 720,
    x: savedState.x,
    y: savedState.y,
    minWidth: 340,
    minHeight: 520,
    maxWidth: 720,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: savedState.alwaysOnTop ?? true,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Load from Vite dev server or production build
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if ((process.env.NODE_ENV === 'development' || !app.isPackaged) && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  } else if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(devUrl).catch(() => {
      setTimeout(() => mainWindow && mainWindow.loadURL(devUrl), 1500);
    });
  }

  mainWindow.on('moved', saveWindowState);
  mainWindow.on('resize', saveWindowState);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register IPC handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:close', () => {
  if (mainWindow) {
    saveWindowState();
    mainWindow.close();
  }
});

ipcMain.handle('window:toggle-pin', () => {
  if (!mainWindow) return false;
  const isTop = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(isTop, 'screen-saver');
  saveWindowState();
  return isTop;
});

ipcMain.handle('window:is-pinned', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : true;
});

ipcMain.handle('window:set-size', (_, { width, height }) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
    saveWindowState();
  }
});

// Quick Launch handlers
ipcMain.handle('launcher:open-url', async (_, targetUrl) => {
  if (!targetUrl) return false;
  try {
    const formatted = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `https://${targetUrl}`;
    await shell.openExternal(formatted);
    return true;
  } catch (err) {
    console.error('Failed to open URL:', err);
    return false;
  }
});

ipcMain.handle('launcher:open-path', async (_, targetPath) => {
  if (!targetPath) return false;
  try {
    if (targetPath.toLowerCase() === 'explorer' || targetPath.toLowerCase() === 'explorer.exe') {
      exec('explorer.exe');
      return true;
    }
    const result = await shell.openPath(targetPath);
    if (result) {
      // If shell.openPath returned an error string, try executing via child_process
      exec(`"${targetPath}"`);
    }
    return true;
  } catch (err) {
    console.error('Failed to open path:', err);
    try {
      exec(`"${targetPath}"`);
      return true;
    } catch (e) {
      return false;
    }
  }
});

ipcMain.handle('launcher:select-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Application or File to Launch',
    properties: ['openFile'],
    filters: [
      { name: 'Executable or Shortcuts', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// System metrics handler
ipcMain.handle('system:get-stats', () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);

  return {
    cpuPercent: getCpuUsage(),
    totalMemGB: (totalMem / (1024 ** 3)).toFixed(1),
    usedMemGB: (usedMem / (1024 ** 3)).toFixed(1),
    freeMemGB: (freeMem / (1024 ** 3)).toFixed(1),
    memPercent: memUsagePercent,
    platform: process.platform,
    hostname: os.hostname(),
    uptimeHours: (os.uptime() / 3600).toFixed(1),
  };
});

// Auto-start integration
ipcMain.handle('settings:get-autostart', () => {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
});

ipcMain.handle('settings:set-autostart', (_, enable) => {
  app.setLoginItemSettings({
    openAtLogin: !!enable,
    path: app.getPath('exe'),
  });
  return !!enable;
});

// Native Notification
ipcMain.handle('notify:show', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'DeskFlow',
      body: body || '',
      silent: false,
    }).show();
    return true;
  }
  return false;
});
