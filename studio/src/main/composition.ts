// The Studio's single composition point: only here are the main-process adapters created with `new`.
import { mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { app, type BrowserWindow } from 'electron';
import { SCRIPT_PROGRESS_EVENT } from '../shared/projects.ts';
import { SETUP_PROGRESS_EVENT } from '../shared/setup.ts';
import { ConfigFolderKeyFiles } from './adapters/ConfigFolderKeyFiles.ts';
import { CoreKeyChecker } from './adapters/CoreKeyChecker.ts';
import { CoreSetupTools } from './adapters/CoreSetupTools.ts';
import { DialogFolderPicker } from './adapters/DialogFolderPicker.ts';
import { DiskProjects } from './adapters/DiskProjects.ts';
import { GizConfigStore } from './adapters/GizConfigStore.ts';
import { GizCore } from './adapters/GizCore.ts';
import { GizScriptCore } from './adapters/GizScriptCore.ts';
import { JsonAppConfig } from './adapters/JsonAppConfig.ts';
import { JsonKeyVault } from './adapters/JsonKeyVault.ts';
import { JsonOpenedFolders } from './adapters/JsonOpenedFolders.ts';
import { RehearsalKeyChecker } from './adapters/rehearsal/RehearsalKeyChecker.ts';
import { RehearsalSetupTools } from './adapters/rehearsal/RehearsalSetupTools.ts';
import { RehearsalTrash } from './adapters/rehearsal/RehearsalTrash.ts';
import { SafeStorageCipher } from './adapters/SafeStorageCipher.ts';
import { ShellTrash } from './adapters/ShellTrash.ts';
import type { Services } from './ipc/handlers.ts';
import { launchFolderOf } from './launchFolder.ts';
import { FolderGrants } from './services/FolderGrants.ts';
import { IdeaService } from './services/IdeaService.ts';
import { KeyService } from './services/KeyService.ts';
import { ProjectService } from './services/ProjectService.ts';
import { ProjectsService } from './services/ProjectsService.ts';
import { ScriptService } from './services/ScriptService.ts';
import { FolderQueue } from './services/FolderQueue.ts';
import { SettingsService } from './services/SettingsService.ts';
import { SetupService } from './services/SetupService.ts';
import { defaultProjectsFolderIn, keyFolderIn, studioPathsOf, systemLanguageOf } from './studioPaths.ts';
import { setInterfaceLanguage } from './text.ts';
import type { WindowSlot } from './WindowSlot.ts';
import { mediaServicesOf } from './composition/media.ts';
import { videoServicesOf } from './composition/video.ts';

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

// Rehearsal mode moves a deleted project into the isolated home, never into the system trash.
const trashOf = () => (STUDIO_PATHS.rehearsal ? new RehearsalTrash(join(STUDIO_PATHS.home, '.lixeira')) : new ShellTrash());

type ScriptParts = Readonly<{ grants: FolderGrants; settings: SettingsService; keys: KeyService; slot: WindowSlot<BrowserWindow>; saves: FolderQueue }>;

/** The home screen, the Idea and the Script stages, on core's script use cases. */
function scriptServicesOf({ grants, settings, keys, slot, saves }: ScriptParts): Pick<Services, 'listing' | 'ideas' | 'script'> {
  const core = new GizScriptCore({ rehearsal: STUDIO_PATHS.rehearsal });
  const disk = new DiskProjects();
  const userData = app.getPath('userData');
  const projectsFolder = async () => (await settings.get()).projectsFolder;
  const opened = new JsonOpenedFolders(join(userData, 'projects.json'));
  const listing = new ProjectsService({ core, disk, trash: trashOf(), grants, opened, projectsFolder });
  const provider = async () => (await settings.get()).providers.text;
  const progress = sendTo(slot, SCRIPT_PROGRESS_EVENT);
  const folders = { newFolder: (theme: string) => listing.newFolder(theme), release: (folder: string) => listing.release(folder) };
  const ideas = new IdeaService({ core, provider, keyOf: (name) => keys.keyOf(name), needsKey: !STUDIO_PATHS.rehearsal, ...folders, portraitsFolder: join(userData, 'portraits'), progress });
  return { listing, ideas, script: new ScriptService({ core, disk, grants, saves }) };
}

/** The services the IPC channels call, wired to core and to Electron; they reach the window through the slot. */
export function createServices(slot: WindowSlot<BrowserWindow>): Services {
  const core = new GizCore();
  const grants = new FolderGrants();
  const [picker, shared] = [new DialogFolderPicker(() => slot.current()), new GizConfigStore(STUDIO_PATHS.gizConfig)];
  const tools = STUDIO_PATHS.rehearsal ? new RehearsalSetupTools() : new CoreSetupTools();
  const keys = keysOf();
  const settings = settingsOf(grants, picker, shared);
  const saves = new FolderQueue(); // each folder's writes in turn: the script editor's and the media stages'
  const media = mediaServicesOf({ grants, settings, keys, slot, saves, rehearsal: STUDIO_PATHS.rehearsal });
  return {
    projects: new ProjectService({ core, picker, grants, launchFolder: launchFolderIn(grants) }),
    ...scriptServicesOf({ grants, settings, keys, slot, saves }),
    ...videoServicesOf({ grants, served: media.served, slot, rehearsal: STUDIO_PATHS.rehearsal, home: STUDIO_PATHS.home }),
    keys,
    settings,
    setup: new SetupService({ tools, shared, progress: sendTo(slot, SETUP_PROGRESS_EVENT) }),
    ...media,
    grants,
  };
}
