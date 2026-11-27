// The Studio's single composition point: only here are the main-process adapters created with `new`.
import { join } from 'node:path';
import { app, type BrowserWindow } from 'electron';
import { RENDER_PROGRESS_EVENT, type RenderProgress } from '../shared/contract.ts';
import { DialogFolderPicker } from './adapters/DialogFolderPicker.ts';
import { GizCore } from './adapters/GizCore.ts';
import { JsonKeyVault } from './adapters/JsonKeyVault.ts';
import { SafeStorageCipher } from './adapters/SafeStorageCipher.ts';
import type { Services } from './ipc/handlers.ts';
import { launchFolderOf } from './launchFolder.ts';
import { FolderGrants } from './services/FolderGrants.ts';
import { KeyService } from './services/KeyService.ts';
import { ProjectService } from './services/ProjectService.ts';
import { RenderService } from './services/RenderService.ts';
import type { WindowSlot } from './WindowSlot.ts';

function progressTo(slot: WindowSlot<BrowserWindow>): (progress: RenderProgress) => void {
  return (progress) => {
    const window = slot.current();
    if (!window || window.isDestroyed()) return;
    window.webContents.send(RENDER_PROGRESS_EVENT, progress);
  };
}

// The folder given on the command line is granted: the person chose it, as with the picker.
function launchFolderIn(grants: FolderGrants): string | null {
  const folder = launchFolderOf(process.argv);
  return folder === null ? null : grants.grant(folder);
}

/** The services the IPC channels call, wired to core and to Electron; they reach the window through the slot. */
export function createServices(slot: WindowSlot<BrowserWindow>): Services {
  const core = new GizCore();
  const grants = new FolderGrants();
  const vault = new JsonKeyVault(join(app.getPath('userData'), 'keys.json'));
  const picker = new DialogFolderPicker(() => slot.current());
  return {
    projects: new ProjectService({ core, picker, grants, launchFolder: launchFolderIn(grants) }),
    video: new RenderService({ core, grants, progress: progressTo(slot) }),
    keys: new KeyService({ cipher: new SafeStorageCipher(), vault }),
  };
}
