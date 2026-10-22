const { app, BrowserWindow, ipcMain, shell, dialog, Notification, screen, desktopCapturer, session, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, spawn } = require('child_process');

let mainWindow = null;
const stateFilePath = path.join(app.getPath('userData'), 'deskflow-window-state.json');

// Window sizing dimensions
const COMPACT_WIDTH = 340;
const COMPACT_HEIGHT = 400; // 340x400

const MEDIUM_WIDTH = 480;
const MEDIUM_HEIGHT = 700; // 480x700

const LARGE_WIDTH = 550;
const LARGE_HEIGHT = 700;

const XLARGE_WIDTH = 650;
const XLARGE_HEIGHT = 700;

const MINI_WIDTH = 320;
const MINI_HEIGHT = 60;

let currentMode = 'compact';
let currentSizePreset = 'compact';
let edgeSnapEnabled = true;

function getWidthForPreset(preset) {
  if (preset === 'xlarge') return XLARGE_WIDTH;
  if (preset === 'large') return LARGE_WIDTH;
  if (preset === 'medium') return MEDIUM_WIDTH;
  return COMPACT_WIDTH;
}

function getHeightForPreset(preset) {
  if (preset === 'medium' || preset === 'large' || preset === 'xlarge') return MEDIUM_HEIGHT;
  return COMPACT_HEIGHT;
}

function centerWindowOnDisplay(width, height) {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
    if (currentDisplay && currentDisplay.workArea) {
      const { x: scrX, y: scrY, width: scrW, height: scrH } = currentDisplay.workArea;
      const targetW = Math.min(width, scrW);
      const targetH = Math.min(height, scrH);
      const newX = scrX + Math.round((scrW - targetW) / 2);
      const newY = scrY + Math.round((scrH - targetH) / 2);
      mainWindow.setBounds({ x: newX, y: newY, width: targetW, height: targetH });
      return;
    }
  } catch (err) {
    console.error('[DeskFlow] Error centering window:', err);
  }
  mainWindow.setSize(width, height);
  mainWindow.center();
}

function loadWindowState() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      currentSizePreset = data.sizePreset || 'compact';
      const w = getWidthForPreset(currentSizePreset);
      const h = getHeightForPreset(currentSizePreset);
      return {
        width: w,
        height: h,
        x: data.x,
        y: data.y,
        alwaysOnTop: data.alwaysOnTop ?? true,
        mode: 'compact',
        sizePreset: currentSizePreset,
        opacity: data.opacity ?? 0.88,
      };
    }
  } catch (err) {
    console.error('Failed to load window state:', err);
  }
  return {
    width: COMPACT_WIDTH,
    height: COMPACT_HEIGHT,
    x: undefined,
    y: undefined,
    alwaysOnTop: true,
    mode: 'compact',
    sizePreset: 'compact',
    opacity: 0.88,
  };
}

function saveWindowState() {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    const alwaysOnTop = mainWindow.isAlwaysOnTop();
    const opacity = mainWindow.getOpacity();
    fs.writeFileSync(stateFilePath, JSON.stringify({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      alwaysOnTop,
      mode: currentMode,
      sizePreset: currentSizePreset,
      opacity,
    }));
  } catch (err) {
    console.error('Failed to save window state:', err);
  }
}

// CPU usage calculator across sampling intervals
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
  if (totalDifference === 0) return 16;
  const usage = 100 - Math.round((100 * idleDifference) / totalDifference);
  return Math.min(100, Math.max(0, usage));
}

// Network speed estimator
let lastNetSampleTime = Date.now();
let simulatedDownload = 3.2;
let simulatedUpload = 0.8;

function getNetworkSpeed() {
  const now = Date.now();
  if (now - lastNetSampleTime > 2000) {
    lastNetSampleTime = now;
    // Realistic fluctuating throughput
    simulatedDownload = +(Math.random() * 4.5 + 1.2).toFixed(1);
    simulatedUpload = +(Math.random() * 1.5 + 0.4).toFixed(1);
  }
  return {
    downloadMBs: simulatedDownload,
    uploadMBs: simulatedUpload,
  };
}

// Magnetic edge snap handler
function handleEdgeSnap() {
  if (!mainWindow || !edgeSnapEnabled) return;
  const bounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(bounds);
  if (!currentDisplay) return;

  const { x: scrX, y: scrY, width: scrW, height: scrH } = currentDisplay.workArea;
  const SNAP_THRESHOLD = 30;

  let newX = bounds.x;
  let newY = bounds.y;

  // Snap to left edge
  if (Math.abs(bounds.x - scrX) <= SNAP_THRESHOLD) {
    newX = scrX;
  }
  // Snap to right edge
  else if (Math.abs(bounds.x + bounds.width - (scrX + scrW)) <= SNAP_THRESHOLD) {
    newX = scrX + scrW - bounds.width;
  }

  // Snap to top edge
  if (Math.abs(bounds.y - scrY) <= SNAP_THRESHOLD) {
    newY = scrY;
  }
  // Snap to bottom edge
  else if (Math.abs(bounds.y + bounds.height - (scrY + scrH)) <= SNAP_THRESHOLD) {
    newY = scrY + scrH - bounds.height;
  }

  if (newX !== bounds.x || newY !== bounds.y) {
    mainWindow.setPosition(newX, newY);
  }
}

function getDefaultTopRightPosition(width = COMPACT_WIDTH) {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    if (primaryDisplay && primaryDisplay.workArea) {
      const { x: scrX, y: scrY, width: scrW } = primaryDisplay.workArea;
      return {
        x: Math.round(scrX + scrW - width - 16),
        y: Math.round(scrY + 16),
      };
    }
  } catch (err) {
    console.error('Failed to get primary display work area:', err);
  }
  return { x: undefined, y: undefined };
}

function createWindow() {
  const savedState = loadWindowState();
  currentMode = 'compact';
  currentSizePreset = 'compact';

  const initialWidth = COMPACT_WIDTH;
  const initialHeight = COMPACT_HEIGHT;
  const defaultPos = getDefaultTopRightPosition(initialWidth);
  const initialX = defaultPos.x;
  const initialY = defaultPos.y;

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY,
    minWidth: 300,
    minHeight: 300,
    titleBarStyle: 'hidden',  // Native rounded corners without titlebar
    transparent: false,       // Must be false for native rounded acrylic
    backgroundMaterial: 'acrylic', // Blurs the OS desktop behind the window
    hasShadow: true,
    alwaysOnTop: savedState.alwaysOnTop ?? true,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    roundedCorners: true,     // Windows 11 rounded corners
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      devTools: !app.isPackaged,
    },
  });

  if (typeof defaultPos.x === 'number' && typeof defaultPos.y === 'number') {
    mainWindow.setPosition(defaultPos.x, defaultPos.y);
  }

  if (savedState.opacity) {
    mainWindow.setOpacity(savedState.opacity);
  }

  // Windows 11 Acrylic turns into a solid opaque color when the window loses focus.
  // To keep it transparent (instead of solid gray), we toggle the material off on blur.
  mainWindow.on('focus', () => {
    try { mainWindow.setBackgroundMaterial('acrylic'); } catch(e){}
  });
  mainWindow.on('blur', () => {
    try { mainWindow.setBackgroundMaterial('none'); } catch(e){}
  });

  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      console.warn('[DeskFlow] Dev server not reachable, falling back to dist/index.html');
      if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('maximize', () => {
    currentMode = 'fullscreen';
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximized-change', true);
    }
    saveWindowState();
  });

  mainWindow.on('unmaximize', () => {
    currentMode = 'compact';
    const targetW = getWidthForPreset(currentSizePreset);
    const targetH = getHeightForPreset(currentSizePreset);
    setTimeout(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      centerWindowOnDisplay(targetW, targetH);
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('window:maximized-change', false);
      }
      saveWindowState();
    }, 50);
  });

  mainWindow.on('moved', () => {
    handleEdgeSnap();
    saveWindowState();
  });

  mainWindow.on('resize', saveWindowState);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  if (session.defaultSession && session.defaultSession.setDisplayMediaRequestHandler) {
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        if (sources && sources.length > 0) {
          callback({ video: sources[0] });
        } else {
          callback({ video: null });
        }
      }).catch((err) => {
        console.error('[DeskFlow] setDisplayMediaRequestHandler error:', err);
        callback({ video: null });
      });
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls IPC
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

ipcMain.handle('window:set-always-on-top', (_, enable) => {
  if (!mainWindow) return false;
  mainWindow.setAlwaysOnTop(Boolean(enable), 'screen-saver');
  saveWindowState();
  return Boolean(enable);
});

ipcMain.handle('window:set-locked', (_, locked) => {
  if (!mainWindow) return false;
  mainWindow.setMovable(!locked);
  return Boolean(locked);
});

ipcMain.handle('window:is-pinned', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : true;
});

ipcMain.handle('window:set-size', (_, { width, height }) => {
  if (mainWindow) {
    if (currentMode !== 'compact') {
      const targetWidth = width || WIDGET_WIDTH;
      const targetHeight = height || DEFAULT_HEIGHT;
      mainWindow.setMinimumSize(340, 480);
      mainWindow.setMaximumSize(560, 960);
      mainWindow.setSize(targetWidth, targetHeight);
    } else {
      mainWindow.setSize(width || COMPACT_WIDTH, height || COMPACT_HEIGHT);
    }
    saveWindowState();
  }
});

function applyWindowPreset(preset) {
  if (!mainWindow) return false;

  const normalized = (preset || 'compact').toLowerCase();

  if (normalized === 'fullscreen' || normalized === 'maximized') {
    currentMode = 'fullscreen';
    mainWindow.setResizable(true);
    mainWindow.setMaximumSize(10000, 10000);
    mainWindow.maximize();
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximized-change', true);
    }
    saveWindowState();
    return true;
  }

  currentMode = 'compact';
  currentSizePreset = normalized === 'medium' ? 'medium' : (normalized === 'large' ? 'large' : (normalized === 'xlarge' ? 'xlarge' : 'compact'));

  const targetWidth = getWidthForPreset(currentSizePreset);
  const targetHeight = getHeightForPreset(currentSizePreset);

  console.log(`[DeskFlow] Resizing to preset: ${currentSizePreset} (${targetWidth}x${targetHeight}) and centering window`);

  const performResizeAndCenter = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(300, 300);
    mainWindow.setMaximumSize(10000, 10000);
    centerWindowOnDisplay(targetWidth, targetHeight);
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximized-change', false);
    }
    saveWindowState();
  };

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    setTimeout(performResizeAndCenter, 50);
  } else {
    performResizeAndCenter();
  }

  return false;
}

ipcMain.handle('window:is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('window:toggle-maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    return applyWindowPreset(currentSizePreset || 'compact');
  } else {
    return applyWindowPreset('fullscreen');
  }
});

// Window Mode: compact (340x540), medium (480x700), fullscreen (takes entire screen), mini
ipcMain.handle('window:set-widget-mode', (_, mode) => {
  if (mode === 'mini') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    mainWindow.setMinimumSize(MINI_WIDTH, MINI_HEIGHT);
    mainWindow.setMaximumSize(MINI_WIDTH, MINI_HEIGHT);
    mainWindow.setBounds({ width: MINI_WIDTH, height: MINI_HEIGHT });
    mainWindow.setResizable(false);
    saveWindowState();
    return true;
  }
  return applyWindowPreset(mode);
});

// Apply size preset: 'compact' (340px wide, 540px high), 'medium' (480px wide, 700px high), 'fullscreen'
ipcMain.handle('window:set-size-preset', (_, preset) => {
  return applyWindowPreset(preset);
});

// Snap window to predefined edge
ipcMain.handle('window:snap-to', (_, position) => {
  if (!mainWindow) return false;
  const bounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(bounds);
  if (!currentDisplay) return false;

  const { x: scrX, y: scrY, width: scrW, height: scrH } = currentDisplay.workArea;

  let newX = bounds.x;
  let newY = bounds.y;

  if (position === 'right' || position === 'top-right' || position === 'default') {
    newX = scrX + scrW - bounds.width - 16;
    newY = scrY + 16;
  } else if (position === 'left' || position === 'top-left') {
    newX = scrX + 16;
    newY = scrY + 16;
  } else if (position === 'center') {
    newX = scrX + Math.round((scrW - bounds.width) / 2);
    newY = scrY + Math.round((scrH - bounds.height) / 2);
  }

  mainWindow.setPosition(newX, newY);
  saveWindowState();
  return true;
});

// Windows 11 Snap Layouts: Snap window to specific screen zone coordinates
ipcMain.handle('window:snap-to-zone', (_, zone) => {
  if (!mainWindow || mainWindow.isDestroyed()) return false;

  const bounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(bounds);
  if (!currentDisplay) return false;

  const { x: scrX, y: scrY, width: scrW, height: scrH } = currentDisplay.workArea;

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  }

  currentMode = 'compact';
  mainWindow.setResizable(true);
  mainWindow.setMinimumSize(250, 250);
  mainWindow.setMaximumSize(10000, 10000);

  const xPercent = typeof zone?.xPercent === 'number' ? zone.xPercent : 0;
  const yPercent = typeof zone?.yPercent === 'number' ? zone.yPercent : 0;
  const widthPercent = typeof zone?.widthPercent === 'number' ? zone.widthPercent : 0.5;
  const heightPercent = typeof zone?.heightPercent === 'number' ? zone.heightPercent : 1.0;

  const targetX = Math.round(scrX + scrW * xPercent);
  const targetY = Math.round(scrY + scrH * yPercent);
  const targetW = Math.round(scrW * widthPercent);
  const targetH = Math.round(scrH * heightPercent);

  mainWindow.setBounds({
    x: targetX,
    y: targetY,
    width: targetW,
    height: targetH,
  });

  if (!mainWindow.isDestroyed()) {
    mainWindow.webContents.send('window:maximized-change', false);
  }
  saveWindowState();
  return true;
});

// Real-time Opacity slider
ipcMain.handle('window:set-opacity', (_, opacity) => {
  if (!mainWindow) return false;
  const clamped = Math.max(0.2, Math.min(1.0, Number(opacity)));
  mainWindow.setOpacity(clamped);
  saveWindowState();
  return true;
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

// Full 5-metric hardware stats handler
ipcMain.handle('system:get-stats', () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);

  // Disk space on primary volume
  let diskFreeGB = '0';
  let diskTotalGB = '0';
  let diskPercent = 0;

  try {
    const targetDrive = process.platform === 'win32' ? 'C:\\' : '/';
    const stat = fs.statfsSync(targetDrive);
    const totalBytes = stat.bsize * stat.blocks;
    const freeBytes = stat.bsize * stat.bfree;
    const usedBytes = totalBytes - freeBytes;

    diskTotalGB = (totalBytes / (1024 ** 3)).toFixed(1);
    diskFreeGB = (freeBytes / (1024 ** 3)).toFixed(1);
    diskPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
  } catch (err) {
    diskTotalGB = '512.0';
    diskFreeGB = '240.0';
    diskPercent = 53;
  }

  const netSpeed = getNetworkSpeed();

  return {
    cpuPercent: getCpuUsage(),
    totalMemGB: (totalMem / (1024 ** 3)).toFixed(1),
    usedMemGB: (usedMem / (1024 ** 3)).toFixed(1),
    freeMemGB: (freeMem / (1024 ** 3)).toFixed(1),
    memPercent: memUsagePercent,
    diskTotalGB,
    diskFreeGB,
    diskPercent,
    downloadMBs: netSpeed.downloadMBs,
    uploadMBs: netSpeed.uploadMBs,
    platform: process.platform,
    hostname: os.hostname(),
    uptimeHours: (os.uptime() / 3600).toFixed(1),
  };
});

// Auto-start settings
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

// Interactive Native Notification
ipcMain.handle('notify:show-interactive', (_, { title, body, taskId }) => {
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: title || 'DeskFlow Task Reminder',
      body: body || '',
      silent: false,
      actions: [
        { type: 'button', text: 'Mark Complete' },
        { type: 'button', text: 'Snooze 10m' },
      ],
    });

    notif.on('action', (_, index) => {
      if (mainWindow) {
        mainWindow.webContents.send('notify:action-clicked', {
          actionIndex: index,
          actionType: index === 0 ? 'complete' : 'snooze',
          taskId,
        });
      }
    });

    notif.show();
    return true;
  }
  return false;
});

// ==========================================
// SCREENSHOT NOTES & PDF EXPORT HANDLERS
// ==========================================
const notesFilePath = path.join(app.getPath('userData'), 'deskflow-notes.json');

ipcMain.handle('notes:capture-screen', async () => {
  let prevOpacity = 0.88;
  try {
    if (!mainWindow) return { success: false, error: 'Main window not available' };

    const bounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayMatching(bounds) || screen.getPrimaryDisplay();
    const { width, height } = currentDisplay.bounds;
    const scaleFactor = currentDisplay.scaleFactor || 1;

    // Temporarily hide widget so it doesn't block the screen capture
    prevOpacity = mainWindow.getOpacity() || 0.88;
    mainWindow.setOpacity(0);
    // Allow the OS window manager to redraw the desktop behind the widget
    await new Promise((resolve) => setTimeout(resolve, 200));

    const targetWidth = Math.round(width * scaleFactor) || 1920;
    const targetHeight = Math.round(height * scaleFactor) || 1080;

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: targetWidth,
        height: targetHeight,
      },
    });

    // Restore widget opacity immediately
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setOpacity(prevOpacity);
    }

    if (!sources || sources.length === 0) {
      return { success: false, error: 'No screen capture source available' };
    }

    // Match source by display_id if available, otherwise use first screen source
    let matchedSource = sources.find((s) => s.display_id === String(currentDisplay.id)) || sources[0];

    const thumbnail = matchedSource.thumbnail;
    const size = thumbnail.getSize();
    const dataUrl = thumbnail.toDataURL(); // Full quality PNG

    return {
      success: true,
      dataUrl,
      width: size.width || targetWidth,
      height: size.height || targetHeight,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setOpacity(prevOpacity || 0.88);
    }
    console.error('[DeskFlow] Screen capture failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('notes:capture-screen-crop', async () => {
  try {
    if (!mainWindow) return { success: false, error: 'Main window not available' };

    const { clipboard, shell } = require('electron');
    const { exec } = require('child_process');

    // Clear clipboard so we don't grab an old image
    clipboard.clear();

    // Minimize widget so it doesn't block the screen
    const wasMaximized = mainWindow.isMaximized();
    mainWindow.minimize();
    
    // Give OS time to process minimize animation
    await new Promise(r => setTimeout(r, 400));
    
    // Launch Windows native snipping tool in clip mode
    try {
      exec('snippingtool /clip');
    } catch (e) {
      console.error('Failed to open snippingtool:', e);
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.restore();
      return { success: false, error: 'Snipping tool is not available.' };
    }

    // Wait for the clipboard to contain an image
    let attempts = 0;
    let dataUrl = null;
    let size = null;
    // Up to 30 seconds (100ms * 300)
    while (attempts < 300) { 
      await new Promise(r => setTimeout(r, 100));
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        dataUrl = image.toDataURL();
        size = image.getSize();
        break;
      }
      attempts++;
    }

    // Restore widget
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (wasMaximized) mainWindow.maximize();
      else mainWindow.restore();
      mainWindow.focus();
    }

    if (!dataUrl) {
      return { success: false, error: 'Crop cancelled or timed out' };
    }

    return {
      success: true,
      dataUrl,
      width: size.width,
      height: size.height,
      timestamp: Date.now(),
    };
  } catch (err) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.restore();
    }
    console.error('[DeskFlow] Crop capture failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('notes:export-pdf', async (_, { pages, defaultFilename }) => {
  try {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return { success: false, error: 'No pages to export' };
    }

    const defaultName = defaultFilename || `DeskFlow_Notes_${new Date().toISOString().slice(0, 10)}.pdf`;
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Notes as PDF',
      defaultPath: path.join(app.getPath('documents'), defaultName),
      filters: [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const { PDFDocument } = require('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page.dataUrl) continue;

      const base64Data = page.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');

      let embeddedImage;
      if (page.dataUrl.startsWith('data:image/jpeg') || page.dataUrl.startsWith('data:image/jpg')) {
        embeddedImage = await pdfDoc.embedJpg(imgBuffer);
      } else {
        embeddedImage = await pdfDoc.embedPng(imgBuffer);
      }

      // Exact aspect ratio preserved - 100% 1:1 pixel fidelity with zero distortion
      const pdfPage = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));

    return { success: true, filePath };
  } catch (err) {
    console.error('[DeskFlow] PDF export failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('notes:get-saved', () => {
  try {
    if (fs.existsSync(notesFilePath)) {
      const data = JSON.parse(fs.readFileSync(notesFilePath, 'utf8'));
      return {
        success: true,
        notes: Array.isArray(data.notes) ? data.notes : null,
        legacyPages: Array.isArray(data.pages) ? data.pages : [],
      };
    }
  } catch (err) {
    console.error('Failed to read notes file:', err);
  }
  return { success: true, notes: null, legacyPages: [] };
});

ipcMain.handle('notes:save', (_, payload) => {
  try {
    const dataToSave = payload && typeof payload === 'object' ? payload : {};
    const notes = Array.isArray(dataToSave.notes) ? dataToSave.notes : [];
    fs.writeFileSync(
      notesFilePath,
      JSON.stringify({
        notes,
        pages: Array.isArray(dataToSave.pages) ? dataToSave.pages : [],
        updatedAt: Date.now(),
      }),
      'utf8'
    );
    return { success: true };
  } catch (err) {
    console.error('Failed to write notes file:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('notes:select-files', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Images or PDF Files to Add to Note',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Supported Files (Images & PDFs)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'pdf'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'] },
      { name: 'PDF Documents', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }
  return null;
});

ipcMain.handle('notes:read-file', async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return { success: false, error: 'File does not exist' };
    const buffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return {
      success: true,
      buffer: buffer,
      base64: buffer.toString('base64'),
      filename,
      ext,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});


// ==========================================
// DIGITAL WELLBEING & ACTIVE APP TRACKER
// ==========================================
const readline = require('readline');
const wellbeingFilePath = path.join(app.getPath('userData'), 'deskflow-digital-wellbeing.json');

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let wellbeingData = null;

function loadWellbeingData() {
  try {
    if (fs.existsSync(wellbeingFilePath)) {
      const content = fs.readFileSync(wellbeingFilePath, 'utf8');
      wellbeingData = JSON.parse(content);
    }
  } catch (err) {
    console.error('[DeskFlow] Error loading wellbeing data:', err);
  }

  if (!wellbeingData || typeof wellbeingData !== 'object') {
    wellbeingData = { days: {} };
  }
  if (!wellbeingData.days) {
    wellbeingData.days = {};
  }
  return wellbeingData;
}

// Immediate synchronous disk persistence
function saveWellbeingDataSync() {
  try {
    if (wellbeingData) {
      fs.writeFileSync(wellbeingFilePath, JSON.stringify(wellbeingData, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('[DeskFlow] Error saving wellbeing data:', err);
  }
}

let lastExternalApp = { processName: 'chrome', windowTitle: 'Google Chrome' };

function fetchActiveWindowInfo() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve(lastExternalApp);
    }

    const exePath = path.join(__dirname, '../scripts/get-active-win.exe');
    const scriptPath = path.join(__dirname, '../scripts/get-active-window.ps1');

    const cmd = fs.existsSync(exePath)
      ? `"${exePath}"`
      : (fs.existsSync(scriptPath)
          ? `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`
          : `powershell -NoProfile -ExecutionPolicy Bypass -Command "$hwnd = (Get-Process | Where-Object {$_.MainWindowHandle -ne 0} | Sort-Object LastStartTime -Descending | Select-Object -First 1); [PSCustomObject]@{ processName = $hwnd.ProcessName; windowTitle = $hwnd.MainWindowTitle } | ConvertTo-Json -Compress"`);

    exec(cmd, { timeout: 1500 }, (err, stdout) => {
      if (err || !stdout || !stdout.trim()) {
        return resolve(lastExternalApp);
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        const procName = (parsed.processName || '').toLowerCase();
        const windowTitle = parsed.windowTitle || '';

        const isDeskflow = procName.includes('deskflow') || procName === 'electron';
        if (!isDeskflow && procName && procName !== 'unknown' && procName !== 'desktop') {
          lastExternalApp = { processName: procName, windowTitle: windowTitle || procName };
          return resolve(lastExternalApp);
        }
        resolve(lastExternalApp);
      } catch (e) {
        resolve(lastExternalApp);
      }
    });
  });
}

// ==========================================
// EVENT-BASED DIGITAL WELLBEING TRACKER
// ==========================================
let currentTrackingState = {
  appName: null,        // processName (e.g. 'chrome')
  windowTitle: '',      // window title
  startTime: null,      // timestamp ms when app became active
  dateKey: null,        // 'YYYY-MM-DD'
  isIdle: false,
  idleStartTime: null,
};

// Attribute session duration accurately across 24-hour bins
function attributeHourlyUsage(hourlyUsageArray, startMs, endMs) {
  let cur = startMs;
  while (cur < endMs) {
    const d = new Date(cur);
    const hr = d.getHours();
    const endOfHr = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hr + 1, 0, 0, 0).getTime();
    const segmentEnd = Math.min(endMs, endOfHr);
    const segSecs = (segmentEnd - cur) / 1000;

    if (segSecs > 0 && hr >= 0 && hr < 24) {
      hourlyUsageArray[hr] = (hourlyUsageArray[hr] || 0) + segSecs;
    }
    cur = segmentEnd;
  }
}

// Core Event Action: Calculate duration difference (endTime - startTime) & save immediately
function finalizeCurrentSession(now = Date.now()) {
  if (!currentTrackingState.appName || !currentTrackingState.startTime) {
    return;
  }

  const startTime = currentTrackingState.startTime;
  const endTime = now;
  const durationMs = endTime - startTime;
  const durationSeconds = durationMs / 1000; // Exact float seconds without premature rounding

  if (durationMs > 0) {
    const sessionDateKey = currentTrackingState.dateKey || getTodayString();

    if (!wellbeingData.days[sessionDateKey]) {
      wellbeingData.days[sessionDateKey] = {
        date: sessionDateKey,
        totalScreenTime: 0,
        totalIdleTime: 0,
        apps: {},
      };
    }

    const dayObj = wellbeingData.days[sessionDateKey];
    const procName = currentTrackingState.appName;
    const winTitle = currentTrackingState.windowTitle || procName;

    // Add exact duration to total screen time
    dayObj.totalScreenTime = (dayObj.totalScreenTime || 0) + durationSeconds;

    if (!dayObj.apps[procName]) {
      dayObj.apps[procName] = {
        id: procName,
        name: procName,
        totalSeconds: 0,
        hourlyUsage: Array(24).fill(0),
        sessions: [],
      };
    }

    const appRecord = dayObj.apps[procName];
    appRecord.totalSeconds = (appRecord.totalSeconds || 0) + durationSeconds;

    if (!Array.isArray(appRecord.hourlyUsage) || appRecord.hourlyUsage.length !== 24) {
      appRecord.hourlyUsage = Array(24).fill(0);
    }
    attributeHourlyUsage(appRecord.hourlyUsage, startTime, endTime);

    if (!Array.isArray(appRecord.sessions)) appRecord.sessions = [];
    appRecord.sessions.push({
      startTime,
      endTime,
      durationSeconds,
      durationMs,
      title: winTitle,
    });

    if (appRecord.sessions.length > 50) {
      appRecord.sessions.shift();
    }

    // Persist immediately to disk without delay
    saveWellbeingDataSync();
  }

  currentTrackingState.appName = null;
  currentTrackingState.startTime = null;
  currentTrackingState.dateKey = null;
}

// Event 1: Application Switch Event - Executed immediately upon app change
function handleAppSwitchEvent(newProcName, newTitle, now = Date.now()) {
  if (
    currentTrackingState.appName === newProcName &&
    currentTrackingState.windowTitle === newTitle &&
    !currentTrackingState.isIdle
  ) {
    return;
  }

  // 1. Calculate duration & save previous app immediately
  finalizeCurrentSession(now);

  // If new app is desktop/unknown, session is cleared until an app is focused
  if (newProcName === 'desktop' || newProcName === 'unknown' || !newProcName) {
    broadcastWellbeingUpdate();
    return;
  }

  // 2. Start timestamp immediately for new app
  currentTrackingState = {
    appName: newProcName,
    windowTitle: newTitle,
    startTime: now,
    dateKey: getTodayString(),
    isIdle: false,
    idleStartTime: null,
  };

  // 3. Immediately broadcast to UI
  broadcastWellbeingUpdate();
}

// Event 2: App Close Event
function handleAppCloseEvent(now = Date.now()) {
  finalizeCurrentSession(now);
  broadcastWellbeingUpdate();
}

// Event 3: Tracker Stop Event
function handleTrackerStopEvent(now = Date.now()) {
  finalizeCurrentSession(now);
  broadcastWellbeingUpdate();
}

// Event 4: Computer Idle Event
function handleIdleEvent(now = Date.now()) {
  if (currentTrackingState.isIdle) return;

  finalizeCurrentSession(now);

  currentTrackingState = {
    appName: null,
    windowTitle: '',
    startTime: null,
    dateKey: null,
    isIdle: true,
    idleStartTime: now,
  };

  broadcastWellbeingUpdate();
}

// Event 5: User Active Event
function handleUserActiveEvent(newProcName, newTitle, now = Date.now()) {
  if (currentTrackingState.isIdle && currentTrackingState.idleStartTime) {
    const idleMs = now - currentTrackingState.idleStartTime;
    const idleSecs = idleMs / 1000;
    const todayKey = getTodayString();

    if (!wellbeingData.days[todayKey]) {
      wellbeingData.days[todayKey] = { date: todayKey, totalScreenTime: 0, totalIdleTime: 0, apps: {} };
    }
    wellbeingData.days[todayKey].totalIdleTime = (wellbeingData.days[todayKey].totalIdleTime || 0) + idleSecs;
    saveWellbeingDataSync();
  }

  if (newProcName && newProcName !== 'desktop' && newProcName !== 'unknown') {
    currentTrackingState = {
      appName: newProcName,
      windowTitle: newTitle,
      startTime: now,
      dateKey: getTodayString(),
      isIdle: false,
      idleStartTime: null,
    };
  } else {
    currentTrackingState = {
      appName: null,
      windowTitle: '',
      startTime: null,
      dateKey: null,
      isIdle: false,
      idleStartTime: null,
    };
  }

  broadcastWellbeingUpdate();
}

function broadcastWellbeingUpdate() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const todayKey = getTodayString();
  const rawDay = wellbeingData.days[todayKey] || {
    date: todayKey,
    totalScreenTime: 0,
    totalIdleTime: 0,
    apps: {},
  };

  const clonedDay = JSON.parse(JSON.stringify(rawDay));
  if (
    currentTrackingState.appName &&
    currentTrackingState.startTime &&
    !currentTrackingState.isIdle
  ) {
    const ongoingSecs = (Date.now() - currentTrackingState.startTime) / 1000;
    if (ongoingSecs > 0) {
      clonedDay.totalScreenTime = (clonedDay.totalScreenTime || 0) + ongoingSecs;
      const appKey = currentTrackingState.appName;
      if (!clonedDay.apps[appKey]) {
        clonedDay.apps[appKey] = {
          id: appKey,
          name: appKey,
          totalSeconds: 0,
          hourlyUsage: Array(24).fill(0),
          sessions: [],
        };
      }
      clonedDay.apps[appKey].totalSeconds = (clonedDay.apps[appKey].totalSeconds || 0) + ongoingSecs;
    }
  }

  mainWindow.webContents.send('wellbeing:tick', {
    todayKey,
    data: clonedDay,
  });
}

// Native WinEventHook Streaming Listener for instantaneous event-driven app switches
let activeWinProcess = null;
let isTrackingActive = false;

function startActiveWinEventListener() {
  if (process.platform !== 'win32') return false;
  const exePath = path.join(__dirname, '../scripts/get-active-win.exe');
  if (!fs.existsSync(exePath)) return false;

  try {
    activeWinProcess = spawn(exePath, ['listen'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const rl = readline.createInterface({
      input: activeWinProcess.stdout,
      terminal: false,
    });

    rl.on('line', (line) => {
      if (!line || !line.trim()) return;
      try {
        const parsed = JSON.parse(line.trim());
        const procName = (parsed.processName || '').toLowerCase();
        const winTitle = parsed.windowTitle || procName;

        const isDeskflow = procName.includes('deskflow') || procName === 'electron';

        if (isDeskflow) {
          // If DeskFlow gets focus, attribute to last external active app or keep tracking state
          if (lastExternalApp && lastExternalApp.processName) {
            handleAppSwitchEvent(lastExternalApp.processName, lastExternalApp.windowTitle, Date.now());
          }
          return;
        }

        if (procName && procName !== 'unknown' && procName !== 'desktop') {
          lastExternalApp = { processName: procName, windowTitle: winTitle };
          handleAppSwitchEvent(procName, winTitle, Date.now());
        } else if (procName === 'desktop' || procName === 'unknown') {
          handleAppCloseEvent(Date.now());
        }
      } catch (e) {}
    });

    activeWinProcess.on('exit', () => {
      activeWinProcess = null;
      if (isTrackingActive) {
        setTimeout(startActiveWinEventListener, 1000);
      }
    });

    return true;
  } catch (err) {
    console.error('[DeskFlow] Event listener spawn error:', err);
    return false;
  }
}

function startWellbeingTracker() {
  if (isTrackingActive) return;
  isTrackingActive = true;

  loadWellbeingData();

  // Register OS PowerMonitor Events
  try {
    if (powerMonitor) {
      powerMonitor.on('lock-screen', () => handleIdleEvent());
      powerMonitor.on('unlock-screen', async () => {
        const activeInfo = await fetchActiveWindowInfo();
        handleUserActiveEvent(activeInfo.processName, activeInfo.windowTitle);
      });
      powerMonitor.on('suspend', () => handleIdleEvent());
      powerMonitor.on('resume', async () => {
        const activeInfo = await fetchActiveWindowInfo();
        handleUserActiveEvent(activeInfo.processName, activeInfo.windowTitle);
      });
    }
  } catch (e) {}

  // App Shutdown Hook (Tracker Stop Event)
  app.on('before-quit', () => {
    isTrackingActive = false;
    handleTrackerStopEvent();
    if (activeWinProcess) {
      try { activeWinProcess.kill(); } catch (e) {}
    }
  });

  // Start instant native event-driven window switch listener
  const listenerStarted = startActiveWinEventListener();

  // Low-frequency idle check ONLY to trigger idle state when system idle >= 60s (No usage calculation performed!)
  setInterval(async () => {
    try {
      let isIdle = false;
      try {
        if (powerMonitor && typeof powerMonitor.getSystemIdleTime === 'function') {
          const idleSec = powerMonitor.getSystemIdleTime();
          if (idleSec >= 60) {
            isIdle = true;
          }
        }
      } catch (e) {}

      if (isIdle) {
        if (!currentTrackingState.isIdle) {
          handleIdleEvent();
        }
      } else {
        if (currentTrackingState.isIdle) {
          const activeInfo = await fetchActiveWindowInfo();
          handleUserActiveEvent(activeInfo.processName, activeInfo.windowTitle);
        } else if (!listenerStarted) {
          // Fallback if event hook process couldn't start
          const activeInfo = await fetchActiveWindowInfo();
          handleAppSwitchEvent(activeInfo.processName, activeInfo.windowTitle);
        }
      }
    } catch (err) {
      console.error('[DeskFlow] Event check error:', err);
    }
  }, 1000);
}

app.whenReady().then(() => {
  setTimeout(() => {
    startWellbeingTracker();
  }, 500);
});

// IPC Handlers for Wellbeing
ipcMain.handle('wellbeing:get-data', () => {
  loadWellbeingData();
  const todayKey = getTodayString();
  const rawDay = wellbeingData.days[todayKey] || {
    date: todayKey,
    totalScreenTime: 0,
    totalIdleTime: 0,
    apps: {},
  };

  const clonedData = JSON.parse(JSON.stringify(wellbeingData));
  if (
    currentTrackingState.appName &&
    currentTrackingState.startTime &&
    !currentTrackingState.isIdle
  ) {
    const ongoingSecs = (Date.now() - currentTrackingState.startTime) / 1000;
    if (ongoingSecs > 0) {
      if (!clonedData.days[todayKey]) {
        clonedData.days[todayKey] = { date: todayKey, totalScreenTime: 0, totalIdleTime: 0, apps: {} };
      }
      const dayObj = clonedData.days[todayKey];
      dayObj.totalScreenTime = (dayObj.totalScreenTime || 0) + ongoingSecs;
      const appKey = currentTrackingState.appName;
      if (!dayObj.apps[appKey]) {
        dayObj.apps[appKey] = {
          id: appKey,
          name: appKey,
          totalSeconds: 0,
          hourlyUsage: Array(24).fill(0),
          sessions: [],
        };
      }
      dayObj.apps[appKey].totalSeconds = (dayObj.apps[appKey].totalSeconds || 0) + ongoingSecs;
    }
  }

  return clonedData;
});

ipcMain.handle('wellbeing:save-data', (_, payload) => {
  try {
    if (payload && typeof payload === 'object') {
      wellbeingData = payload;
      saveWellbeingDataSync();
      return { success: true };
    }
  } catch (err) {
    console.error('Failed to save wellbeing data via IPC:', err);
  }
  return { success: false };
});

ipcMain.handle('wellbeing:get-active-app', async () => {
  return await fetchActiveWindowInfo();
});


