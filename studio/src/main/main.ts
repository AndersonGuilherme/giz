import { app, BrowserWindow, ipcMain, session } from 'electron';
import started from 'electron-squirrel-startup';
import { createServices, preparePaths } from './composition.ts';
import { afterReady } from './ipc/afterReady.ts';
import { handlersOf } from './ipc/handlers.ts';
import { registerChannels } from './ipc/registry.ts';
import { REQUEST_SCHEMAS } from './ipc/schemas.ts';
import { isTrustedSender } from './ipc/senderTrust.ts';
import { launcher } from './launcher.ts';
import { quitAfterSaves } from './quitGuard.ts';
import { denyAllPermissions } from './security/permissions.ts';
import { translate } from './text.ts';
import { appOrigin, createMainWindow } from './window.ts';
import { WindowSlot } from './WindowSlot.ts';

// Windows installer events (Squirrel) start the app only to create or remove shortcuts.
if (started) app.quit();

const slot = new WindowSlot<BrowserWindow>();
preparePaths();

// Once per app run: the permission policy and the IPC channels (only our window's top frame may call them).
function register(): void {
  denyAllPermissions(session.defaultSession);
  const rules = { window: () => slot.current(), origin: appOrigin() };
  const services = createServices(slot);
  // The saved language and projects folder take effect before any channel answers (see afterReady).
  const restored = services.settings.restore().catch((error: unknown) => console.error('giz: the saved settings could not be restored:', error));
  const handlers = afterReady(handlersOf(services), restored);
  registerChannels(ipcMain, { schemas: REQUEST_SCHEMAS, handlers, trusts: (event) => isTrustedSender(event, rules) });
  quitAfterSaves(app, () => services.script.settled());
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
