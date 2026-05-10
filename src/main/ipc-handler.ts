import { ipcMain, BrowserWindow, app } from 'electron';
import { shellExec, getCurrentChildProcess } from './service/shell-service';

export function registerIPCHandlers(mainWindow: BrowserWindow) {
  /// --------------------------------------- invoke -----------------------------------

  // 'run command'
  ipcMain.handle('shell:exec', async (_event, command: string) => {
    shellExec(mainWindow, command);
    return { ok: true, from: 'shell:exec' };
  });

  // 处理中断命令的请求
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

  /**
   * window操作
   */
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

  /// --------------------------------------- on ---------------------------------------

  // 当渲染器加载完毕，发送一次测试消息（渲染器会订阅 `push-from-main`）
  mainWindow.webContents.on('did-finish-load', () => {
    try {
      mainWindow.webContents.send('push-from-main', { text: 'hello from main (did-finish-load)' });
    } catch (e) {
      console.warn('failed to send `push-from-main`', e);
    }
  });
}
