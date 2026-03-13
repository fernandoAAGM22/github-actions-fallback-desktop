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
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.FALLBACK_DESKTOP_URL || 'http://127.0.0.1:5179';
  const builtIndex = path.join(__dirname, '..', 'dist', 'index.html');
  win.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    console.error('fallback-desktop did-fail-load', { code, description, validatedURL });
  });
  win.webContents.on('console-message', (_event, level, message, lineNumber, sourceId) => {
    console.log(`fallback-desktop console[${level}] ${sourceId}:${lineNumber} ${message}`);
  });
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
