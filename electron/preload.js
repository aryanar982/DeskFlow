const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('deskflowAPI', {
  isElectron: true,
  windowControl: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    togglePin: () => ipcRenderer.invoke('window:toggle-pin'),
    isPinned: () => ipcRenderer.invoke('window:is-pinned'),
    setSize: (width, height) => ipcRenderer.invoke('window:set-size', { width, height }),
    setWidgetMode: (mode) => ipcRenderer.invoke('window:set-widget-mode', mode),
    setClickThrough: (enable) => ipcRenderer.invoke('window:set-click-through', enable),
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
  }
});
