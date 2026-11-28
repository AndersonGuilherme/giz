import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { AiOverrides } from '../composition/aiOverrides.ts';
import { UsageError } from '../usage.ts';
import { costLines, stageLines } from './statusLines.ts';

// `gizzy status`: what each stage has, what is out of date and what the rest costs. The composition loads on demand.
const status = () => import('../composition/status.ts');
const USAGE = 'uso: gizzy status <pasta> [--regenerate-script]';
const OPTIONS = { 'regenerate-script': { type: 'boolean' } } as const;

function parsed(args: readonly string[]) {
  try {
    return parseArgs({ args: [...args], options: OPTIONS, allowPositionals: true, strict: true });
  } catch {
    throw new UsageError(USAGE);
  }
}

function optionsOf(args: readonly string[]): Readonly<{ folder: string; regenerateScript: boolean }> {
  const { values, positionals } = parsed(args);
  if (positionals.length !== 1) throw new UsageError(USAGE);
  return { folder: resolve(positionals[0]!), regenerateScript: values['regenerate-script'] ?? false };
}

/** `gizzy status <folder>`: the stages (idea → video) and the cost of the pending paid steps; nothing is called. */
export async function statusCommand(args: readonly string[], overrides: AiOverrides = {}): Promise<void> {
  const { folder, regenerateScript } = optionsOf(args);
  const { projectStages, estimateCosts, imageServiceOf, voiceServiceOf } = await status();
  const found = await projectStages(overrides).run(folder);
  const { estimate, text } = estimateCosts(overrides);
  const costs = await estimate.run(folder, found, { regenerateScript });
  const { project } = found;
  const services = { text, images: project && imageServiceOf(project, overrides), voice: project && voiceServiceOf(project) };
  console.log([`etapas de ${folder}:`, ...stageLines(found.stages.each()), ...costLines(costs, services)].join('\n'));
}
