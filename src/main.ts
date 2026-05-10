import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { registerIPCHandlers } from './main/ipc-handler';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createTrayIcon(): Tray {
  // Create a simple 16x16 status indicator icon (green dot)
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const cx = (i % size) - size / 2;
    const cy = Math.floor(i / size) - size / 2;
    const r = Math.sqrt(cx * cx + cy * cy);
    if (r < size / 2 - 1) {
      canvas[i * 4] = 0x2f;     // R
      canvas[i * 4 + 1] = 0xa7; // G
      canvas[i * 4 + 2] = 0x00; // B
      canvas[i * 4 + 3] = 0xff; // A
    }
  }
  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });

  const trayInstance = new Tray(icon);
  trayInstance.setToolTip('Obsidian LAN Sync Bridge');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  trayInstance.setContextMenu(contextMenu);
  trayInstance.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return trayInstance;
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#d31515ff',
      height: 48,
    },
    autoHideMenuBar: true,
    frame: false,
    hasShadow: true,
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Intercept close → hide to tray
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  registerIPCHandlers(mainWindow);

  return mainWindow;
};

app.on('ready', () => {
  createWindow();
  tray = createTrayIcon();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // Don't quit — the app lives in the tray
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
  }
});
