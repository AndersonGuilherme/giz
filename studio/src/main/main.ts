import { app, BrowserWindow, ipcMain, session } from 'electron';
import started from 'electron-squirrel-startup';
import { createServices } from './composition.ts';
import { handlersOf } from './ipc/handlers.ts';
import { registerChannels } from './ipc/registry.ts';
import { REQUEST_SCHEMAS } from './ipc/schemas.ts';
import { isTrustedSender } from './ipc/senderTrust.ts';
import { launcher } from './launcher.ts';
import { denyAllPermissions } from './security/permissions.ts';
import { translate } from './text.ts';
import { appOrigin, createMainWindow } from './window.ts';
import { WindowSlot } from './WindowSlot.ts';

// Windows installer events (Squirrel) start the app only to create or remove shortcuts.
if (started) app.quit();

const slot = new WindowSlot<BrowserWindow>();

// Once per app run: the permission policy and the IPC channels (only our window's top frame may call them).
function register(): void {
  denyAllPermissions(session.defaultSession);
  const rules = { window: () => slot.current(), origin: appOrigin() };
  registerChannels(ipcMain, { schemas: REQUEST_SCHEMAS, handlers: handlersOf(createServices(slot)), trusts: (event) => isTrustedSender(event, rules) });
}

function openWindow(): void {
  const window = createMainWindow(translate('app.title'));
  slot.hold(window);
  window.on('closed', () => slot.release(window));
}

const start = launcher({ register, openWindow });

void app.whenReady().then(start);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) start();
});
