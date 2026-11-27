import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { ImageProgress, ImageReport } from '../../../application/use-cases/images/GenerateScenarioImages.ts';
import type { ImageSelection } from '../../../application/use-cases/images/scenarioImageJobs.ts';
import { IMAGE_PROVIDERS, isImageProvider } from '../../../domain/ai/ImageProviderName.ts';
import { projectRepository } from '../composition.ts';
import type { TextOverrides } from '../composition/text.ts';
import { dollars } from '../dollars.ts';
import { UsageError } from '../usage.ts';

// `giz images`: the scenario images made by an image AI. The composition part loads on demand.
const images = () => import('../composition/images.ts');
const USAGE = `uso: giz images <pasta> [--provider ${IMAGE_PROVIDERS.join('|')}] [--estimate] [--only <fala>] [--force <fala>]`;
const OPTIONS = { provider: { type: 'string' }, estimate: { type: 'boolean' }, only: { type: 'string' }, force: { type: 'string' } } as const;

type Options = Readonly<{ folder: string; provider?: string; estimate: boolean; selection: ImageSelection }>;

function parsed(args: readonly string[]) {
  try {
    return parseArgs({ args: [...args], options: OPTIONS, allowPositionals: true, strict: true });
  } catch {
    throw new UsageError(USAGE);
  }
}

// --only and --force both pick one scene: together they would contradict each other.
function optionsOf(args: readonly string[]): Options {
  const { values, positionals } = parsed(args);
  if (positionals.length !== 1 || (values.only && values.force)) throw new UsageError(USAGE);
  const selection = { only: values.only, force: values.force };
  return { folder: resolve(positionals[0]!), provider: values.provider, estimate: values.estimate ?? false, selection };
}

const showProgress = ({ done, total, lineId, generated }: ImageProgress) =>
  console.log(`cena da fala ${lineId} (${done}/${total}): ${generated ? 'imagem gerada' : 'já em dia'}`);

const report = (folder: string, { generated, kept }: ImageReport) =>
  console.log(`${generated.length} gerada(s), ${kept.length} já em dia → ${resolve(folder, 'scenes')}\npróximo passo: giz check ${folder}`);

/** `giz images <folder>`: the estimate first; with --estimate nothing is called, otherwise the images are made. */
export async function imagesCommand(args: readonly string[], overrides: TextOverrides = {}): Promise<void> {
  const options = optionsOf(args);
  const project = await projectRepository().load(options.folder);
  const { scenarioImages, defaultImageProvider } = await images();
  const name = options.provider ?? defaultImageProvider(project, overrides);
  if (!isImageProvider(name)) throw new UsageError(`provedor "${name}" inválido (use ${IMAGE_PROVIDERS.join(', ')})`);
  const { generate, model } = scenarioImages(options.folder, name, overrides);
  const { pending, current, cost } = await generate.estimate(project, options.selection);
  console.log(`custo estimado (${name}, modelo ${model}): ${pending} imagem(ns) a gerar, até ${dollars(cost)}; ${current} já em dia`);
  if (options.estimate) return;
  report(options.folder, await generate.run(project, options.selection, showProgress));
}
