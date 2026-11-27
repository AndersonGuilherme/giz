// Part of the Studio's composition point (see composition.ts): the Video stage (montage, preview, render, output).
import type { BrowserWindow } from 'electron';
import { RENDER_PROGRESS_EVENT } from '../../shared/contract.ts';
import { ElectronShell } from '../adapters/ElectronShell.ts';
import { DiskMediaFiles } from '../adapters/media/DiskMediaFiles.ts';
import { RehearsalShell } from '../adapters/rehearsal/RehearsalShell.ts';
import { GizVideoCore } from '../adapters/video/GizVideoCore.ts';
import type { FolderGrants } from '../services/FolderGrants.ts';
import type { ServedFolders } from '../services/media/ServedFolders.ts';
import { RenderService } from '../services/RenderService.ts';
import { BuildService } from '../services/video/BuildService.ts';
import { VideoService } from '../services/video/VideoService.ts';
import type { WindowSlot } from '../WindowSlot.ts';

type Parts = Readonly<{ grants: FolderGrants; served: ServedFolders; slot: WindowSlot<BrowserWindow>; rehearsal: boolean; home: string }>;

// Rehearsal mode renders for real, but only the first second, and the desktop requests go to a log in the home.
const REHEARSAL_FRAMES = 30;

/** The render and the Video stage, sharing one montage service ("montar" before the preview and before the render). */
export function videoServicesOf({ grants, served, slot, rehearsal, home }: Parts): Readonly<{ video: RenderService; videoStage: VideoService }> {
  const core = new GizVideoCore(rehearsal ? { frames: REHEARSAL_FRAMES } : {});
  const files = new DiskMediaFiles();
  // Core's sound effects and fonts folders are served to the preview, never granted (no channel may take them for a project).
  const build = new BuildService({ core, grants, serve: (folder) => void served.serve(folder) });
  const shell = rehearsal ? new RehearsalShell(home) : new ElectronShell(() => slot.current());
  const progress = (payload: unknown) => {
    const window = slot.current();
    if (window && !window.isDestroyed()) window.webContents.send(RENDER_PROGRESS_EVENT, payload);
  };
  return { video: new RenderService({ core, build, files, grants, progress }), videoStage: new VideoService({ core, build, files, shell, grants }) };
}
