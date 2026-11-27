import { app, BrowserWindow, ipcMain } from 'electron';
import started from 'electron-squirrel-startup';
import { createServices } from './composition.ts';
import { handlersOf } from './ipc/handlers.ts';
import { registerChannels } from './ipc/registry.ts';
import { REQUEST_SCHEMAS } from './ipc/schemas.ts';
import { translate } from './text.ts';
import { createMainWindow } from './window.ts';

// Windows installer events (Squirrel) start the app only to create or remove shortcuts.
if (started) app.quit();

function start(): void {
  const window = createMainWindow(translate('app.title'));
  registerChannels(ipcMain, REQUEST_SCHEMAS, handlersOf(createServices(window)));
}

void app.whenReady().then(start);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) start();
});
