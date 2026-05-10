import { ipcMain, BrowserWindow, app } from 'electron';
import { shellExec, getCurrentChildProcess } from './service/shell-service';
import { startServer, stopServer, getStatus } from './service/webdav-service';

export function registerIPCHandlers(mainWindow: BrowserWindow) {
  /// --------------------------------------- invoke -----------------------------------

  // shell
  ipcMain.handle('shell:exec', async (_event, command: string) => {
    shellExec(mainWindow, command);
    return { ok: true, from: 'shell:exec' };
  });

  ipcMain.handle('shell:interrupt', async () => {
    try {
      const child = getCurrentChildProcess();
      if (child && !child.killed) {
        console.log('Interrupting current command');
        if (process.platform === 'win32') {
          child.kill();
        } else {
          process.kill(child.pid, 'SIGINT');
        }
        return { ok: true, message: 'Command interrupted' };
      }
      return { ok: false, message: 'No active command to interrupt' };
    } catch (error) {
      console.error('Failed to interrupt command:', error);
      return { ok: false, error: String(error) };
    }
  });

  // window
  ipcMain.handle('sys:closeWindow', async () => {
    mainWindow.close();
    return { ok: true, status: 'close' };
  });

  ipcMain.handle('sys:maximizeWindow', async () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return { ok: true, status: 'unmaximize' };
    } else {
      mainWindow.maximize();
      return { ok: true, status: 'maximize' };
    }
  });

  ipcMain.handle('sys:minimizeWindow', async () => {
    mainWindow.minimize();
    return { ok: true, status: 'minimize' };
  });

  ipcMain.handle('app:showWindow', async () => {
    mainWindow.show();
    mainWindow.focus();
    return { ok: true };
  });

  ipcMain.handle('app:quit', async () => {
    app.quit();
    return { ok: true };
  });

  // webdav
  ipcMain.handle('webdav:start', async (_event, vaultPath: string, port?: number) => {
    const status = await startServer(vaultPath, port || 8080);
    mainWindow.webContents.send('webdav:statusChanged', status);
    return { ok: true, status };
  });

  ipcMain.handle('webdav:stop', async () => {
    await stopServer();
    const status = getStatus();
    mainWindow.webContents.send('webdav:statusChanged', status);
    return { ok: true, status };
  });

  ipcMain.handle('webdav:status', async () => {
    return { ok: true, status: getStatus() };
  });

  /// --------------------------------------- on ---------------------------------------

  mainWindow.webContents.on('did-finish-load', () => {
    try {
      mainWindow.webContents.send('webdav:statusChanged', getStatus());
    } catch (e) {
      console.warn('failed to send webdav:statusChanged', e);
    }
  });
}
