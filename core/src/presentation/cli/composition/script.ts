// Part of the composition point (see composition.ts): the script generation with a text AI.
import { fileURLToPath } from 'node:url';
import type { ProjectFolder } from '../../../application/ports/ProjectFolder.ts';
import { GenerateScript } from '../../../application/use-cases/script/GenerateScript.ts';
import { TEXT_PROVIDERS, type TextProviderName } from '../../../domain/ai/TextProviderName.ts';
import { DiskScriptMaterials } from '../../../infrastructure/ai/script/DiskScriptMaterials.ts';
import { DiskProjectFolder } from '../../../infrastructure/disk/DiskProjectFolder.ts';
import { RigCatalogFromRegistry } from '../../rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../../rigs/rigRegistry.ts';
import { checkProject, projectRepository } from '../composition.ts';
import { cliKeyStore, textProviderOf, type TextOverrides } from './text.ts';

const inPackage = (path: string) => fileURLToPath(new URL(`../../../../${path}`, import.meta.url));

// The ready characters offered to the AI: one folder per era, the creatures and the lesson presenters.
const MATERIALS = {
  formats: inPackage('formats'),
  casts: ['present', 'past', 'future', 'creatures'].map((era) => inPackage(`casts/presets/${era}`)).concat(inPackage('casts/example')),
  scenes: inPackage('presets/scenes'),
};

/** The script generator with the chosen provider, and that provider's model (for the estimate line). */
export function scriptGenerator(name: TextProviderName, overrides: TextOverrides = {}): Readonly<{ generate: GenerateScript; model: string }> {
  const text = textProviderOf(name, overrides);
  const folder = projectFolder();
  const dependencies = { text, materials: new DiskScriptMaterials(MATERIALS), rigs: new RigCatalogFromRegistry(rigRegistry) };
  return { generate: new GenerateScript({ ...dependencies, folder, repository: projectRepository(), check: checkProject() }), model: text.model() };
}

export function projectFolder(): ProjectFolder {
  return new DiskProjectFolder();
}

/** Without a chosen provider: the first one with a key (Anthropic when none has, whose error says where to put it). */
export function defaultTextProvider(overrides: TextOverrides = {}): TextProviderName {
  const keys = overrides.keys ?? cliKeyStore();
  return TEXT_PROVIDERS.find((name) => keys.get(name) !== undefined) ?? 'anthropic';
}
