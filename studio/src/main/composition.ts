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
import { KeyService } from './services/KeyService.ts';
import { ProjectService } from './services/ProjectService.ts';
import { RenderService } from './services/RenderService.ts';

function progressTo(window: BrowserWindow): (progress: RenderProgress) => void {
  return (progress) => {
    if (window.isDestroyed()) return;
    window.webContents.send(RENDER_PROGRESS_EVENT, progress);
  };
}

/** The services the IPC channels call, wired to core and to Electron. */
export function createServices(window: BrowserWindow): Services {
  const core = new GizCore();
  const vault = new JsonKeyVault(join(app.getPath('userData'), 'keys.json'));
  return {
    projects: new ProjectService({ core, picker: new DialogFolderPicker(window), launchFolder: launchFolderOf(process.argv) }),
    video: new RenderService({ core, progress: progressTo(window) }),
    keys: new KeyService({ cipher: new SafeStorageCipher(), vault }),
  };
}
