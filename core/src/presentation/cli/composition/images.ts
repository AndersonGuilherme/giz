// Part of the composition point (see composition.ts): the image AI providers and the scenario images.
import type { ImageProvider } from '../../../application/ports/ImageProvider.ts';
import { GenerateScenarioImages } from '../../../application/use-cases/images/GenerateScenarioImages.ts';
import { IMAGE_PROVIDERS, type ImageProviderName } from '../../../domain/ai/ImageProviderName.ts';
import type { Project } from '../../../domain/project/Project.ts';
import { FAL_IMAGE_API } from '../../../infrastructure/ai/image/falImageApi.ts';
import { GEMINI_IMAGE_API } from '../../../infrastructure/ai/image/geminiImageApi.ts';
import { HttpImageProvider } from '../../../infrastructure/ai/image/HttpImageProvider.ts';
import type { ImageApi } from '../../../infrastructure/ai/image/imageApi.ts';
import { OPENAI_IMAGE_API } from '../../../infrastructure/ai/image/openAiImageApi.ts';
import { DiskScenarioImageStore } from '../../../infrastructure/disk/DiskScenarioImageStore.ts';
import { realWait as wait } from '../../../infrastructure/http/serviceRequest.ts';
import type { AiOverrides } from './aiOverrides.ts';
import { cliKeyStore } from './text.ts';

const APIS: Readonly<Record<ImageProviderName, ImageApi>> = { openai: OPENAI_IMAGE_API, gemini: GEMINI_IMAGE_API, fal: FAL_IMAGE_API };
// The model of each image provider can be changed without touching the code; empty means the default.
const MODEL_VARIABLES: Readonly<Record<ImageProviderName, string>> = {
  openai: 'GIZ_OPENAI_IMAGE_MODEL',
  gemini: 'GIZ_GEMINI_IMAGE_MODEL',
  fal: 'GIZ_FAL_IMAGE_MODEL',
};

const modelOf = (name: ImageProviderName) => process.env[MODEL_VARIABLES[name]]?.trim() || undefined;

/** The image provider, with the model of GIZ_<PROVIDER>_IMAGE_MODEL or the default; the key is read only when called. */
export function imageProviderOf(name: ImageProviderName, overrides: AiOverrides = {}): HttpImageProvider {
  return new HttpImageProvider(APIS[name], { fetch, keys: cliKeyStore(), wait, ...overrides }, modelOf(name));
}

/** The scenario images of the project folder, made with that provider, and its model (for the estimate line). */
export function scenarioImages(folder: string, name: ImageProviderName, overrides: AiOverrides = {}): Readonly<{ generate: GenerateScenarioImages; model: string }> {
  const images = imageProviderOf(name, overrides);
  return { generate: new GenerateScenarioImages({ images, store: new DiskScenarioImageStore(folder) }), model: images.identity().model };
}

/** The scenario images made with any image provider (the Studio's rehearsal painter): the same store and rules. */
export function scenarioImagesWith(folder: string, images: ImageProvider): GenerateScenarioImages {
  return new GenerateScenarioImages({ images, store: new DiskScenarioImageStore(folder) });
}

/** The project's `imageProvider`; without it, the first one with a key (OpenAI when none has, whose error says where to put it). */
export function defaultImageProvider(project: Project, overrides: AiOverrides = {}): ImageProviderName {
  const keys = overrides.keys ?? cliKeyStore();
  return project.imageProvider() ?? IMAGE_PROVIDERS.find((name) => keys.get(name) !== undefined) ?? 'openai';
}
