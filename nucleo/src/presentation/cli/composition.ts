// Single composition point: only here are the adapters created with `new`.
import { GenerateVoices } from '../../application/use-cases/GenerateVoices.ts';
import { CheckProject } from '../../application/use-cases/CheckProject.ts';
import type { VoiceProvider } from '../../application/ports/VoiceProvider.ts';
import type { ProjectRepository } from '../../application/ports/ProjectRepository.ts';
import { createLayoutRegistry } from '../../domain/layout/defaultLayoutRegistry.ts';
import type { Project } from '../../domain/project/Project.ts';
import { EnvelopeAligner } from '../../infrastructure/alignment/EnvelopeAligner.ts';
import { WhisperAligner } from '../../infrastructure/alignment/WhisperAligner.ts';
import { WhisperListener } from '../../infrastructure/alignment/WhisperListener.ts';
import { DiskVoiceStore } from '../../infrastructure/disk/DiskVoiceStore.ts';
import { DiskProjectRepository } from '../../infrastructure/disk/DiskProjectRepository.ts';
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
  return new CheckProject({ layouts: createLayoutRegistry() });
}
