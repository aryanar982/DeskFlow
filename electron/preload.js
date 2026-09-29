const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deskflowAPI', {
  isElectron: true,
  windowControl: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    togglePin: () => ipcRenderer.invoke('window:toggle-pin'),
    isPinned: () => ipcRenderer.invoke('window:is-pinned'),
    setSize: (width, height) => ipcRenderer.invoke('window:set-size', { width, height }),
    setSizePreset: (preset) => ipcRenderer.invoke('window:set-size-preset', preset),
    setWidgetMode: (mode) => ipcRenderer.invoke('window:set-widget-mode', mode),
    snapTo: (position) => ipcRenderer.invoke('window:snap-to', position),
    setOpacity: (opacity) => ipcRenderer.invoke('window:set-opacity', opacity),
  },
  launcher: {
    openUrl: (url) => ipcRenderer.invoke('launcher:open-url', url),
    openPath: (path) => ipcRenderer.invoke('launcher:open-path', path),
    selectFile: () => ipcRenderer.invoke('launcher:select-file'),
  },
  system: {
    getStats: () => ipcRenderer.invoke('system:get-stats'),
  },
  settings: {
    getAutostart: () => ipcRenderer.invoke('settings:get-autostart'),
    setAutostart: (enable) => ipcRenderer.invoke('settings:set-autostart', enable),
  },
  notify: {
    show: (title, body) => ipcRenderer.invoke('notify:show', { title, body }),
    showInteractive: (options) => ipcRenderer.invoke('notify:show-interactive', options),
  },
  notes: {
    captureScreen: () => ipcRenderer.invoke('notes:capture-screen'),
    exportPdf: (payload) => ipcRenderer.invoke('notes:export-pdf', payload),
    getSavedNotes: () => ipcRenderer.invoke('notes:get-saved'),
    saveNotes: (data) => ipcRenderer.invoke('notes:save', data),
    openFile: (filePath) => ipcRenderer.invoke('launcher:open-path', filePath),
  },
});
