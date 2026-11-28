// Part of the Studio's composition point (see composition.ts): the Cast, Scenarios and Voices stages.
import { join } from 'node:path';
import { app, type BrowserWindow } from 'electron';
import type { QwenModel } from '../../shared/cast.ts';
import { SCENARIOS_PROGRESS_EVENT } from '../../shared/scenarios.ts';
import { VOICES_PROGRESS_EVENT } from '../../shared/voices.ts';
import { coreEditing } from '../adapters/coreModules.ts';
import { DiskMediaFiles } from '../adapters/media/DiskMediaFiles.ts';
import { GizMediaCore } from '../adapters/media/GizMediaCore.ts';
import { RehearsalPainter } from '../adapters/media/rehearsal/RehearsalPainter.ts';
import { RehearsalVoice } from '../adapters/media/rehearsal/RehearsalVoice.ts';
import { voiceWorkerChannel } from '../adapters/media/voiceWorkerChannel.ts';
import { WorkerVoiceWork } from '../adapters/media/WorkerVoiceWork.ts';
import { DiskProjects } from '../adapters/DiskProjects.ts';
import type { FolderGrants } from '../services/FolderGrants.ts';
import type { FolderQueue } from '../services/FolderQueue.ts';
import type { KeyService } from '../services/KeyService.ts';
import { CastService } from '../services/media/CastService.ts';
import { ScenarioService } from '../services/media/ScenarioService.ts';
import { ServedFolders } from '../services/media/ServedFolders.ts';
import { VoiceService } from '../services/media/VoiceService.ts';
import type { SettingsService } from '../services/SettingsService.ts';
import type { WindowSlot } from '../WindowSlot.ts';

type Parts = Readonly<{ grants: FolderGrants; settings: SettingsService; keys: KeyService; slot: WindowSlot<BrowserWindow>; saves: FolderQueue; voices: WorkerVoiceWork; localVoiceReady: (model?: QwenModel) => Promise<boolean>; rehearsal: boolean }>;

/** The voice worker's runner (one for the app): the lines and samples are made there; `restart` after a setup change. */
export const voiceWorkOf = (rehearsal: boolean): WorkerVoiceWork => new WorkerVoiceWork(voiceWorkerChannel(rehearsal));

function sendTo<Payload>(slot: WindowSlot<BrowserWindow>, event: string): (payload: Payload) => void {
  return (payload) => {
    const window = slot.current();
    if (!window || window.isDestroyed()) return;
    window.webContents.send(event, payload);
  };
}

// Rehearsal mode paints and speaks with stand-ins: no network, no key, no voice model.
const standInsOf = (rehearsal: boolean) => (rehearsal ? { painter: (real: ConstructorParameters<typeof RehearsalPainter>[0]) => new RehearsalPainter(real), voice: new RehearsalVoice() } : undefined);

/**
 * The Cast, Scenarios and Voices services, and what the media scheme serves: the samples folder is served, never
 * granted (no channel can open or write it as a project). The lines and samples are made in the voice worker.
 */
export function mediaServicesOf({ grants, settings, keys, slot, saves, voices, localVoiceReady, rehearsal }: Parts) {
  const core = new GizMediaCore(standInsOf(rehearsal), voices);
  const [disk, files] = [new DiskProjects(), new DiskMediaFiles()];
  const served = new ServedFolders(grants);
  const samples = served.serve(join(app.getPath('userData'), 'samples'));
  const shared = { core, disk, files, grants, saves, keyOf: (name: Parameters<KeyService['keyOf']>[0]) => keys.keyOf(name), needsKey: !rehearsal, localVoiceReady };
  const vectors = async () => [...(await coreEditing()).scriptVocabulary().backgrounds];
  const provider = async () => (await settings.get()).providers.image;
  const lines = new VoiceService({ ...shared, progress: sendTo(slot, VOICES_PROGRESS_EVENT) });
  return {
    cast: new CastService({ ...shared, samples, voicesBusy: () => lines.generating() }),
    scenarios: new ScenarioService({ ...shared, vectors, provider, progress: sendTo(slot, SCENARIOS_PROGRESS_EVENT) }),
    voices: lines,
    served,
  };
}
