import './formerEnvironment.ts';
import { app, BrowserWindow, ipcMain, session } from 'electron';
import started from 'electron-squirrel-startup';
import { createServices, formerUserData, preparePaths, STUDIO_PATHS } from './composition.ts';
import { afterReady } from './ipc/afterReady.ts';
import { handlersOf } from './ipc/handlers.ts';
import { registerChannels } from './ipc/registry.ts';
import { REQUEST_SCHEMAS } from './ipc/schemas.ts';
import { isAppUrl, isTrustedSender } from './ipc/senderTrust.ts';
import { launcher } from './launcher.ts';
import { secondLaunch } from './secondLaunch.ts';
import { PROJECT_LAUNCHED_EVENT } from '../shared/projects.ts';
import { coreEnvironmentOf } from './studioPaths.ts';
import { quitAfterSaves } from './quitGuard.ts';
import { registerMediaScheme, serveMedia } from './security/mediaProtocol.ts';
import { allowOnlyOurMicrophone } from './security/permissions.ts';
import { translate } from './text.ts';
import { appOrigin, createMainWindow } from './window.ts';
import { WindowSlot } from './WindowSlot.ts';

// Windows installer events (Squirrel) start the app only to create or remove shortcuts.
if (started) app.quit();

const slot = new WindowSlot<BrowserWindow>();
// How long a quit waits for a cancelled render, voice or image job to end before it quits anyway.
const STOP_WAIT = 5000;
preparePaths();
// Before core is first loaded (and before any worker starts): where its writable files go in this run.
Object.assign(process.env, coreEnvironmentOf(STUDIO_PATHS, { packaged: app.isPackaged, userData: app.getPath('userData'), env: process.env, former: formerUserData() }));
registerMediaScheme();

// A later launch's project, once the services exist: granted, made the launched one, and the window told.
let relaunch: (folder: string) => void = () => undefined;

// Once per app run: the permission policy and the IPC channels (only our window's top frame may call them).
function register(): void {
  const rules = { window: () => slot.current(), origin: appOrigin() };
  allowOnlyOurMicrophone(session.defaultSession, { contents: () => slot.current()?.webContents, isAppUrl: (url) => isAppUrl(url, rules.origin) });
  const services = createServices(slot);
  serveMedia((path) => services.served.allows(path));
  // The saved language and projects folder take effect before any channel answers (see afterReady).
  const restored = services.settings.restore().catch((error: unknown) => console.error('Gizzycera: the saved settings could not be restored:', error));
  const handlers = afterReady(handlersOf(services), restored);
  registerChannels(ipcMain, { schemas: REQUEST_SCHEMAS, handlers, trusts: (event) => isTrustedSender(event, rules) });
  relaunch = (folder) => {
    services.projects.relaunched(folder);
    slot.current()?.webContents.send(PROJECT_LAUNCHED_EVENT);
  };
  // Quitting waits for the writes in flight and stops a running render (its browser and encoder) and voice or image
  // job, briefly at most.
  const jobs = [services.video, services.voices, services.scenarios];
  quitAfterSaves(app, () => Promise.all([services.script.settled(), ...jobs.map((job) => job.stop(STOP_WAIT))]).then(() => undefined));
}

function openWindow(): void {
  const window = createMainWindow(translate('app.title'));
  slot.hold(window);
  window.on('closed', () => slot.release(window));
}

const start = launcher({ register, openWindow });

// One Studio at a time (per userData, so an isolated home has its own): two would share the projects, the settings
// and the voice worker's models. A second launch hands its command line to this one and quits.
const primary = app.requestSingleInstanceLock();
if (!primary) app.quit();
if (primary) {
  const onSecondLaunch = secondLaunch({ window: () => slot.current(), open: start, relaunch: (folder) => relaunch(folder) });
  app.on('second-instance', (_event, argv, workingDirectory) => void app.whenReady().then(() => onSecondLaunch(argv, workingDirectory)));
  void app.whenReady().then(start);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) start();
});
