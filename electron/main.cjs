const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: '#0b1220',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.FALLBACK_DESKTOP_URL || 'http://127.0.0.1:5179';
  const builtIndex = path.join(__dirname, '..', 'dist', 'index.html');
  if (process.env.FALLBACK_DESKTOP_URL || !fs.existsSync(builtIndex)) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(builtIndex);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
