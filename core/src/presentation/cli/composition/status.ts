// Part of the composition point (see composition.ts): the stages of a project and the cost of what is pending.
import { EstimateCosts } from '../../../application/use-cases/status/EstimateCosts.ts';
import { ReadProjectStages } from '../../../application/use-cases/status/ReadProjectStages.ts';
import type { StatusTools } from '../../../application/use-cases/status/stageItems.ts';
import type { Project, VoiceProviderName } from '../../../domain/project/Project.ts';
import { DiskProjectStateReader } from '../../../infrastructure/disk/DiskProjectStateReader.ts';
import { DiskScenarioImageStore } from '../../../infrastructure/disk/DiskScenarioImageStore.ts';
import { DiskVoiceStore } from '../../../infrastructure/disk/DiskVoiceStore.ts';
import { externalSettings, type ExternalSettings } from '../../../infrastructure/voice/external/externalSettings.ts';
import { checkProject, projectRepository } from '../composition.ts';
import type { AiOverrides } from './aiOverrides.ts';
import { defaultImageProvider, imageProviderOf } from './images.ts';
import { defaultTextProvider, projectFolder, scriptGenerator } from './script.ts';
import { voiceOf } from './voices.ts';

// The project's own voice and image providers: only their hashes and estimates are used, no key is read, nothing is called.
function toolsOf(folder: string, project: Project, overrides: AiOverrides): StatusTools {
  const images = imageProviderOf(defaultImageProvider(project, overrides), overrides);
  return { voice: voiceOf(folder, project), voices: new DiskVoiceStore(folder), images, scenarioImages: new DiskScenarioImageStore(folder) };
}

export function projectStages(overrides: AiOverrides = {}): ReadProjectStages {
  const tools = (folder: string, project: Project) => toolsOf(folder, project, overrides);
  return new ReadProjectStages({ repository: projectRepository(), check: checkProject(), reader: new DiskProjectStateReader(), tools });
}

/** The costs with the default text provider (the first with a key), and that provider and model. */
export function estimateCosts(overrides: AiOverrides = {}): Readonly<{ estimate: EstimateCosts; text: string }> {
  const name = defaultTextProvider(overrides);
  const { generate, model } = scriptGenerator(name, overrides);
  return { estimate: new EstimateCosts({ folder: projectFolder(), script: generate }), text: `${name}, modelo ${model}` };
}

/** The image provider and model of a loaded project, for its cost line. */
export function imageServiceOf(project: Project, overrides: AiOverrides = {}): string {
  const name = defaultImageProvider(project, overrides);
  return `${name}, modelo ${imageProviderOf(name, overrides).identity().model}`;
}

// The paid voices name their model (from the environment); the local voice and own recordings are free.
const VOICE_SERVICES: Readonly<Record<VoiceProviderName, (settings: ExternalSettings) => string>> = {
  qwen: () => 'qwen, grátis',
  recording: () => 'gravação própria, grátis',
  elevenlabs: (settings) => `elevenlabs, modelo ${settings.elevenLabsModel}`,
  fish: (settings) => `fish, modelo ${settings.fishModel}`,
};

/** The voice service and model of a loaded project, for its cost line. */
export function voiceServiceOf(project: Project): string {
  return VOICE_SERVICES[project.voice().provider](externalSettings(process.env, () => undefined));
}
