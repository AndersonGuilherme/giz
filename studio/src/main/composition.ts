// The Studio's single composition point: only here are the main-process adapters created with `new`.
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { app, type BrowserWindow } from 'electron';
import { RENDER_PROGRESS_EVENT } from '../shared/contract.ts';
import { SETUP_PROGRESS_EVENT } from '../shared/setup.ts';
import { ConfigFolderKeyFiles } from './adapters/ConfigFolderKeyFiles.ts';
import { CoreKeyChecker } from './adapters/CoreKeyChecker.ts';
import { CoreSetupTools } from './adapters/CoreSetupTools.ts';
import { DialogFolderPicker } from './adapters/DialogFolderPicker.ts';
import { GizConfigStore } from './adapters/GizConfigStore.ts';
import { GizCore } from './adapters/GizCore.ts';
import { JsonAppConfig } from './adapters/JsonAppConfig.ts';
import { JsonKeyVault } from './adapters/JsonKeyVault.ts';
import { RehearsalKeyChecker } from './adapters/rehearsal/RehearsalKeyChecker.ts';
import { RehearsalSetupTools } from './adapters/rehearsal/RehearsalSetupTools.ts';
import { SafeStorageCipher } from './adapters/SafeStorageCipher.ts';
import type { Services } from './ipc/handlers.ts';
import { launchFolderOf } from './launchFolder.ts';
import { FolderGrants } from './services/FolderGrants.ts';
import { KeyService } from './services/KeyService.ts';
import { ProjectService } from './services/ProjectService.ts';
import { RenderService } from './services/RenderService.ts';
import { SettingsService } from './services/SettingsService.ts';
import { SetupService } from './services/SetupService.ts';
import { defaultProjectsFolderIn, keyFolderIn, studioPathsOf, systemLanguageOf } from './studioPaths.ts';
import { setInterfaceLanguage } from './text.ts';
import type { WindowSlot } from './WindowSlot.ts';

export const STUDIO_PATHS = studioPathsOf(process.env, homedir());

/** Before the app is ready: an isolated Studio home gets its own userData. */
export function preparePaths(): void {
  if (STUDIO_PATHS.userData) app.setPath('userData', STUDIO_PATHS.userData);
}

function sendTo<Payload>(slot: WindowSlot<BrowserWindow>, event: string): (payload: Payload) => void {
  return (payload) => {
    const window = slot.current();
    if (!window || window.isDestroyed()) return;
    window.webContents.send(event, payload);
  };
}

// The folder given on the command line is granted: the person chose it, as with the picker.
function launchFolderIn(grants: FolderGrants): string | null {
  const folder = launchFolderOf(process.argv);
  return folder === null ? null : grants.grant(folder);
}

const makeFolder = async (folder: string) => void (await mkdir(folder, { recursive: true }));

function settingsOf(grants: FolderGrants, picker: DialogFolderPicker, shared: GizConfigStore): SettingsService {
  const { home } = STUDIO_PATHS;
  const appConfig = new JsonAppConfig(join(app.getPath('userData'), 'studio.json'));
  const base = { app: appConfig, shared, picker, grants, makeFolder, onLanguage: setInterfaceLanguage };
  return new SettingsService({ ...base, defaultProjectsFolder: defaultProjectsFolderIn(home), systemLanguage: systemLanguageOf(app.getLocale()) });
}

function keysOf(): KeyService {
  const vault = new JsonKeyVault(join(app.getPath('userData'), 'keys.json'));
  const files = new ConfigFolderKeyFiles(keyFolderIn(STUDIO_PATHS.home));
  const checker = STUDIO_PATHS.rehearsal ? new RehearsalKeyChecker() : new CoreKeyChecker();
  return new KeyService({ cipher: new SafeStorageCipher(), vault, files, checker });
}

/** The services the IPC channels call, wired to core and to Electron; they reach the window through the slot. */
export function createServices(slot: WindowSlot<BrowserWindow>): Services {
  const core = new GizCore();
  const grants = new FolderGrants();
  const picker = new DialogFolderPicker(() => slot.current());
  const shared = new GizConfigStore(STUDIO_PATHS.gizConfig);
  const tools = STUDIO_PATHS.rehearsal ? new RehearsalSetupTools() : new CoreSetupTools();
  return {
    projects: new ProjectService({ core, picker, grants, launchFolder: launchFolderIn(grants) }),
    video: new RenderService({ core, grants, progress: sendTo(slot, RENDER_PROGRESS_EVENT) }),
    keys: keysOf(),
    settings: settingsOf(grants, picker, shared),
    setup: new SetupService({ tools, shared, progress: sendTo(slot, SETUP_PROGRESS_EVENT) }),
  };
}
