const { app, clipboard } = require('electron'); app.whenReady().then(() => { console.log(clipboard.readImage().isEmpty()); app.quit(); });
