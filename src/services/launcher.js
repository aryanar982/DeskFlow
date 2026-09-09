export const launcher = {
  isElectron: () => typeof window !== 'undefined' && !!window.deskflowAPI?.isElectron,

  open: async (item) => {
    const isElec = launcher.isElectron();

    if (item.type === 'url') {
      const url = item.target.startsWith('http://') || item.target.startsWith('https://')
        ? item.target
        : `https://${item.target}`;

      if (isElec) {
        return await window.deskflowAPI.launcher.openUrl(url);
      } else {
        window.open(url, '_blank');
        return true;
      }
    } else {
      // Local App or Folder
      if (isElec) {
        return await window.deskflowAPI.launcher.openPath(item.target);
      } else {
        console.info(`[Desktop Launcher] Simulating launch for: ${item.target}`);
        alert(`[Desktop Launcher Mode]\nLaunching local application or folder:\n"${item.target}"\n(Runs natively when DeskFlow is open as a Windows Widget)`);
        return true;
      }
    }
  },

  selectFile: async () => {
    if (launcher.isElectron()) {
      return await window.deskflowAPI.launcher.selectFile();
    } else {
      return prompt('Enter application executable name, command or full path (e.g. notepad, calc, code, C:\\Program Files\\...):', 'calc');
    }
  },
};
