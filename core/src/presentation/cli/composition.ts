// Single composition point: only here (and in composition/, its parts) are the adapters created with `new`.
import { fileURLToPath } from 'node:url';
import { BuildTimeline } from '../../application/use-cases/BuildTimeline.ts';
import { ProduceVideo } from '../../application/use-cases/ProduceVideo.ts';
import { RenderVideo } from '../../application/use-cases/RenderVideo.ts';
import { GenerateVoices } from '../../application/use-cases/GenerateVoices.ts';
import { CheckProject } from '../../application/use-cases/CheckProject.ts';
import type { ProjectRepository } from '../../application/ports/ProjectRepository.ts';
import { CAPTION_LAYOUTS } from '../../domain/caption/captionLayouts.ts';
import { createLayoutRegistry } from '../../domain/layout/defaultLayoutRegistry.ts';
import type { Project } from '../../domain/project/Project.ts';
import { EnvelopeAligner } from '../../infrastructure/alignment/EnvelopeAligner.ts';
import { WhisperAligner, type Listener } from '../../infrastructure/alignment/WhisperAligner.ts';
import { WhisperListener } from '../../infrastructure/alignment/WhisperListener.ts';
import { DiskVoiceStore } from '../../infrastructure/disk/DiskVoiceStore.ts';
import { DiskProjectRepository } from '../../infrastructure/disk/DiskProjectRepository.ts';
import { SrtCaptionWriter } from '../../infrastructure/disk/SrtCaptionWriter.ts';
import { RemotionRenderer } from '../../infrastructure/render/RemotionRenderer.ts';
import { RemotionPortraits } from '../../infrastructure/render/RemotionPortraits.ts';
import { RemotionSheet } from '../../infrastructure/render/RemotionSheet.ts';
import { headlessShellIn } from '../../infrastructure/render/browserLocation.ts';
import { EspeakPhonemizer } from '../../infrastructure/phonetics/EspeakPhonemizer.ts';
import { RigCatalogFromRegistry } from '../rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../rigs/rigRegistry.ts';
import { voiceOf, type VoiceKeys } from './composition/voices.ts';
import type { VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import { OwnRecordingFirst } from '../../infrastructure/voice/OwnRecordingFirst.ts';

export function projectRepository(): ProjectRepository {
  return new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) });
}

const warn = (message: string) => console.log(`AVISO: ${message}`);

export function generateVoices(folder: string, project: Project): GenerateVoices {
  const voice = voiceOf(folder, project);
  const aligner = new WhisperAligner(new EnvelopeAligner(), new WhisperListener(), warn);
  return new GenerateVoices({ voice, phonemizer: new EspeakPhonemizer(), store: new DiskVoiceStore(folder), aligner });
}

/**
 * The Studio's voices: the project voice with the Studio's keys, or another voice (its rehearsal voice); a line the
 * person recorded comes from that take either way. `whisper` false aligns the words by the envelope only (no model);
 * `listener`: a Whisper already loaded (the Studio's voice worker keeps one).
 */
export type StudioVoices = Readonly<{ keys?: VoiceKeys; voice?: VoiceProvider; whisper?: boolean; listener?: Listener }>;

export function generateVoicesWith(folder: string, project: Project, options: StudioVoices): GenerateVoices {
  const voice = options.voice ? new OwnRecordingFirst(options.voice, folder) : voiceOf(folder, project, options.keys);
  const envelope = new EnvelopeAligner();
  const aligner = options.whisper === false ? envelope : new WhisperAligner(envelope, options.listener ?? new WhisperListener(), warn);
  return new GenerateVoices({ voice, phonemizer: new EspeakPhonemizer(), store: new DiskVoiceStore(folder), aligner });
}

export function checkProject(): CheckProject {
  return new CheckProject({ layouts: createLayoutRegistry(), captions: CAPTION_LAYOUTS, rigs: new RigCatalogFromRegistry(rigRegistry) });
}

export function buildTimeline(folder: string): BuildTimeline {
  return new BuildTimeline({ store: new DiskVoiceStore(folder) });
}

// The Remotion entry point (the compositions), the package public folder (the sound effects) and the package's Chrome
// Headless Shell: all resolved from the package, so `giz` works from any working directory (and later from Electron).
const PACKAGE_FOLDER = fileURLToPath(new URL('../../..', import.meta.url));
const REMOTION = {
  entryPoint: fileURLToPath(new URL('../remotion/index.ts', import.meta.url)),
  publicFolder: fileURLToPath(new URL('../../../public', import.meta.url)),
  browserExecutable: headlessShellIn(PACKAGE_FOLDER),
};

/** The package public folder: the sound effects the video plays (`sounds/<name>.wav`), also for the Studio's preview. */
export const publicFolder = (): string => REMOTION.publicFolder;

/** The Studio's render options: `variant` names other output files (the other aspect); `frames` renders only the first ones. */
export type VideoOutput = Readonly<{ variant?: string; frames?: number }>;

/** `signal` (optional): aborting it cancels the render, as the Studio's cancel button does. */
export function renderVideo(folder: string, signal?: AbortSignal, output: VideoOutput = {}): RenderVideo {
  const renderer = new RemotionRenderer(REMOTION, folder, { signal, frames: output.frames });
  return new RenderVideo({ build: buildTimeline(folder), renderer, captions: new SrtCaptionWriter(), variant: output.variant });
}

export function produceVideo(folder: string): ProduceVideo {
  const voices = (project: Project) => generateVoices(folder, project);
  return new ProduceVideo({ repository: projectRepository(), check: checkProject(), voices, render: renderVideo(folder) });
}

export function characterSheet(): RemotionSheet {
  return new RemotionSheet(REMOTION);
}

/** The ready characters' portraits in one picture (the Studio's cast picker). */
export function castPortraits(): RemotionPortraits {
  return new RemotionPortraits(REMOTION);
}
