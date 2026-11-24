// Single composition point: only here are the adapters created with `new`.
import { fileURLToPath } from 'node:url';
import { BuildTimeline } from '../../application/use-cases/BuildTimeline.ts';
import { ProduceVideo } from '../../application/use-cases/ProduceVideo.ts';
import { RenderVideo } from '../../application/use-cases/RenderVideo.ts';
import { GenerateVoices } from '../../application/use-cases/GenerateVoices.ts';
import { CheckProject } from '../../application/use-cases/CheckProject.ts';
import type { VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import type { ProjectRepository } from '../../application/ports/ProjectRepository.ts';
import { CAPTION_LAYOUTS } from '../../domain/caption/captionLayouts.ts';
import { createLayoutRegistry } from '../../domain/layout/defaultLayoutRegistry.ts';
import type { Project } from '../../domain/project/Project.ts';
import { EnvelopeAligner } from '../../infrastructure/alignment/EnvelopeAligner.ts';
import { WhisperAligner } from '../../infrastructure/alignment/WhisperAligner.ts';
import { WhisperListener } from '../../infrastructure/alignment/WhisperListener.ts';
import { DiskVoiceStore } from '../../infrastructure/disk/DiskVoiceStore.ts';
import { DiskProjectRepository } from '../../infrastructure/disk/DiskProjectRepository.ts';
import { SrtCaptionWriter } from '../../infrastructure/disk/SrtCaptionWriter.ts';
import { RemotionRenderer } from '../../infrastructure/render/RemotionRenderer.ts';
import { RemotionSheet } from '../../infrastructure/render/RemotionSheet.ts';
import { headlessShellIn } from '../../infrastructure/render/browserLocation.ts';
import { EspeakPhonemizer } from '../../infrastructure/phonetics/EspeakPhonemizer.ts';
import { RecordingVoice } from '../../infrastructure/voice/RecordingVoice.ts';
import { QwenVoice } from '../../infrastructure/voice/QwenVoice.ts';
import { RigCatalogFromRegistry } from '../rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../rigs/rigRegistry.ts';

type Provider = ReturnType<Project['voice']>['provider'];

const PROVIDERS: Readonly<Record<Provider, (folder: string, project: Project) => VoiceProvider>> = {
  qwen: (_folder, project) => new QwenVoice(project.voice().model),
  recording: (folder) => new RecordingVoice(folder),
};

export function projectRepository(): ProjectRepository {
  return new DiskProjectRepository({ catalog: new RigCatalogFromRegistry(rigRegistry) });
}

const warn = (message: string) => console.log(`AVISO: ${message}`);

export function generateVoices(folder: string, project: Project): GenerateVoices {
  const voice = PROVIDERS[project.voice().provider](folder, project);
  const aligner = new WhisperAligner(new EnvelopeAligner(), new WhisperListener(), warn);
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

export function renderVideo(folder: string): RenderVideo {
  return new RenderVideo({ build: buildTimeline(folder), renderer: new RemotionRenderer(REMOTION, folder), captions: new SrtCaptionWriter() });
}

export function produceVideo(folder: string): ProduceVideo {
  const voices = (project: Project) => generateVoices(folder, project);
  return new ProduceVideo({ repository: projectRepository(), check: checkProject(), voices, render: renderVideo(folder) });
}

export function characterSheet(): RemotionSheet {
  return new RemotionSheet(REMOTION);
}
