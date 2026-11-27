// Part of the composition point (see composition.ts): the script generation with a text AI.
import { fileURLToPath } from 'node:url';
import type { ProjectFolder } from '../../../application/ports/ProjectFolder.ts';
import type { TextProvider } from '../../../application/ports/TextProvider.ts';
import { GenerateScript } from '../../../application/use-cases/script/GenerateScript.ts';
import { StartScript } from '../../../application/use-cases/script/StartScript.ts';
import { TEXT_PROVIDERS, type TextProviderName } from '../../../domain/ai/TextProviderName.ts';
import { DiskScriptMaterials } from '../../../infrastructure/ai/script/DiskScriptMaterials.ts';
import { DiskProjectFolder } from '../../../infrastructure/disk/DiskProjectFolder.ts';
import { RigCatalogFromRegistry } from '../../rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../../rigs/rigRegistry.ts';
import { checkProject, projectRepository } from '../composition.ts';
import type { AiOverrides } from './aiOverrides.ts';
import { cliKeyStore, textProviderOf } from './text.ts';

const inPackage = (path: string) => fileURLToPath(new URL(`../../../../${path}`, import.meta.url));

// The ready characters offered to the AI: one folder per era, the creatures and the lesson presenters.
const MATERIALS = {
  formats: inPackage('formats'),
  casts: ['present', 'past', 'future', 'creatures'].map((era) => inPackage(`casts/presets/${era}`)).concat(inPackage('casts/example')),
  scenes: inPackage('presets/scenes'),
};

/** The script generator with the chosen provider, and that provider's model (for the estimate line). */
export function scriptGenerator(name: TextProviderName, overrides: AiOverrides = {}): Readonly<{ generate: GenerateScript; model: string }> {
  const text = textProviderOf(name, overrides);
  return { generate: scriptGeneratorWith(text), model: text.model() };
}

/** The script generator with any text provider (the Studio's rehearsal mode passes a pretend one). */
export function scriptGeneratorWith(text: TextProvider): GenerateScript {
  const dependencies = { text, materials: scriptMaterials(), rigs: new RigCatalogFromRegistry(rigRegistry) };
  return new GenerateScript({ ...dependencies, folder: projectFolder(), repository: projectRepository(), check: checkProject() });
}

/** The guides and the ready characters and scenes (the Studio lists the presets from here). */
export function scriptMaterials(): DiskScriptMaterials {
  return new DiskScriptMaterials(MATERIALS);
}

/** A project to write by hand, from an idea. */
export function startScript(): StartScript {
  return new StartScript({ materials: scriptMaterials(), folder: projectFolder() });
}

export function projectFolder(): ProjectFolder {
  return new DiskProjectFolder();
}

/** Without a chosen provider: the first one with a key (Anthropic when none has, whose error says where to put it). */
export function defaultTextProvider(overrides: AiOverrides = {}): TextProviderName {
  const keys = overrides.keys ?? cliKeyStore();
  return TEXT_PROVIDERS.find((name) => keys.get(name) !== undefined) ?? 'anthropic';
}
