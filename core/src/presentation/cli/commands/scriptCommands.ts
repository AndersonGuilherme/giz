import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { ScriptResult, ScriptTarget } from '../../../application/use-cases/script/GenerateScript.ts';
import { isTextProvider, TEXT_PROVIDERS } from '../../../domain/ai/TextProviderName.ts';
import { DomainError } from '../../../domain/DomainError.ts';
import { Idea } from '../../../domain/idea/Idea.ts';
import type { TextOverrides } from '../composition/text.ts';
import { dollars } from '../dollars.ts';
import { UsageError } from '../usage.ts';

// `giz new` and `giz script`: the script written by a text AI. The composition part loads on demand.
const script = () => import('../composition/script.ts');
const OPTIONS_USAGE = `[--provider ${TEXT_PROVIDERS.join('|')}] [--estimate]`;
const NEW_USAGE = `uso: giz new --idea <ideia.json> <pasta> ${OPTIONS_USAGE}`;
const SCRIPT_USAGE = `uso: giz script <pasta> ${OPTIONS_USAGE}`;
const OPTIONS = { idea: { type: 'string' }, provider: { type: 'string' }, estimate: { type: 'boolean' } } as const;

type Options = Readonly<{ folder: string; idea?: string; provider?: string; estimate: boolean }>;

function parsed(args: readonly string[], usage: string) {
  try {
    return parseArgs({ args: [...args], options: OPTIONS, allowPositionals: true, strict: true });
  } catch {
    throw new UsageError(usage);
  }
}

function optionsOf(args: readonly string[], usage: string): Options {
  const { values, positionals } = parsed(args, usage);
  if (positionals.length !== 1) throw new UsageError(usage);
  return { folder: resolve(positionals[0]!), idea: values.idea, provider: values.provider, estimate: values.estimate ?? false };
}

// The idea's problems name the file they came from.
const fromFile = (file: string, error: unknown) => (error instanceof DomainError ? new DomainError(`${file}: ${error.message}`) : error);

function ideaOf(json: unknown, file: string): Idea {
  try {
    return Idea.fromJson(json);
  } catch (error) {
    throw fromFile(file, error);
  }
}

function parsedJson(text: string, file: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file}: JSON inválido (${(error as Error).message})`);
  }
}

// Why the idea file could not be read, by the system's error code.
const READ_FAILURES: Readonly<Record<string, string>> = {
  ENOENT: 'arquivo não encontrado',
  EISDIR: 'é uma pasta, não um arquivo',
  EACCES: 'sem permissão para ler o arquivo',
  EPERM: 'sem permissão para ler o arquivo',
};

function readFailure(file: string, error: unknown): Error {
  const code = String((error as NodeJS.ErrnoException).code);
  const reason = Object.hasOwn(READ_FAILURES, code) ? READ_FAILURES[code] : `não foi possível ler (${(error as Error).message})`;
  return new Error(`${file}: ${reason}`);
}

async function ideaFile(file: string): Promise<Idea> {
  const text = await readFile(file, 'utf8').catch((error: unknown) => {
    throw readFailure(file, error);
  });
  return ideaOf(parsedJson(text, file), file);
}

function report(folder: string, { files, repairs, usage }: ScriptResult): void {
  const lines = (files.script as { lines?: unknown[] }).lines?.length ?? 0;
  console.log(`roteiro: ${lines} fala(s), ${files.cast.length} personagem(ns), ${repairs} rodada(s) de correção → ${folder}`);
  console.log(`uso: ${usage.calls} chamada(s), ${usage.inputTokens} tokens de entrada, ${usage.outputTokens} de saída`);
  console.log(`próximo passo: giz check ${folder}`);
}

// The estimate always comes first; with --estimate nothing is called.
async function generated(idea: Idea, target: ScriptTarget, options: Options & { overrides: TextOverrides }): Promise<void> {
  const { scriptGenerator, defaultTextProvider } = await script();
  const name = options.provider ?? defaultTextProvider(options.overrides);
  if (!isTextProvider(name)) throw new UsageError(`provedor "${name}" inválido (use ${TEXT_PROVIDERS.join(', ')})`);
  const { generate, model } = scriptGenerator(name, options.overrides);
  const { firstCall, maximum } = await generate.estimate(idea);
  console.log(`custo estimado (${name}, modelo ${model}): até ${dollars(firstCall)} na primeira chamada, até ${dollars(maximum)} com 3 correções`);
  if (options.estimate) return;
  report(target.folder, await generate.run(idea, target));
}

const exists = (path: string) => access(path).then(() => true, () => false);

/** `giz new --idea <idea.json> <folder>`: a new project written by the text AI; the idea is kept as idea.json. */
export async function newCommand(args: readonly string[], overrides: TextOverrides = {}): Promise<void> {
  const options = optionsOf(args, NEW_USAGE);
  if (!options.idea) throw new UsageError(NEW_USAGE);
  if (await exists(join(options.folder, 'project.json'))) throw new Error(`já existe um projeto em ${options.folder} (para refazer o roteiro: giz script ${options.folder})`);
  const idea = await ideaFile(resolve(options.idea));
  await generated(idea, { folder: options.folder }, { ...options, overrides });
}

/** `giz script <folder>`: the script of an existing project written again from its idea.json, keeping its voice. */
export async function scriptCommand(args: readonly string[], overrides: TextOverrides = {}): Promise<void> {
  const options = optionsOf(args, SCRIPT_USAGE);
  if (options.idea) throw new UsageError(SCRIPT_USAGE);
  const folder = (await script()).projectFolder();
  const idea = ideaOf(await folder.readIdea(options.folder), join(options.folder, 'idea.json'));
  await generated(idea, { folder: options.folder, voice: await folder.storedVoice(options.folder) }, { ...options, overrides });
}
