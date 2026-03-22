import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    backgroundColor: '#0d0f14',
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    title: "Time Arena - Focus Mode",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Handle outside links properly
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
       import('electron').then(({ shell }) => shell.openExternal(url));
       return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// Security & Menu
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
