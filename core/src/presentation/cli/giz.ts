#!/usr/bin/env node
// Usage: npx giz <subcommand> [arguments] (or node src/presentation/cli/giz.ts <subcommand> [arguments])
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import type { Progress } from '../../application/use-cases/GenerateVoices.ts';
import type { Problem } from '../../application/use-cases/CheckProject.ts';
import { buildTimeline, characterSheet, checkProject, generateVoices, produceVideo, projectRepository, renderVideo } from './composition.ts';
import { convertCommand } from './commands/convertCommand.ts';
import { imagesCommand } from './commands/imagesCommand.ts';
import { keysCommand } from './commands/keysCommand.ts';
import { qaCommand } from './commands/qaCommands.ts';
import { newCommand, scriptCommand } from './commands/scriptCommands.ts';
import { gpuCommand, modelsCommand, soundsCommand } from './commands/toolCommands.ts';
import { setupCommand } from './setup/setupCommand.ts';
import { UsageError } from './usage.ts';

type Subcommand = (args: readonly string[]) => Promise<void>;

function folderOf(folder: string | undefined, subcommand: string): string {
  if (!folder) throw new UsageError(`uso: giz ${subcommand} <pasta-do-projeto>`);
  return resolve(folder);
}

function showProgress({ done, total, lineId, generated }: Progress): void {
  console.log(`fala ${lineId} (${done}/${total}): ${generated ? 'voz gerada' : 'já em dia'}`);
}

// One line per 10% of the render, not one per frame.
function renderProgress(): (fraction: number) => void {
  let shown = -1;
  return (fraction) => {
    const tenth = Math.floor(fraction * 10);
    if (tenth <= shown) return;
    shown = tenth;
    console.log(`renderizando: ${tenth * 10}%`);
  };
}

function problemLine(level: 'ERRO' | 'AVISO', { line, message }: Problem): string {
  return line ? `${level} fala ${line}: ${message}` : `${level}: ${message}`;
}

async function voice([folder]: readonly string[]): Promise<void> {
  const path = folderOf(folder, 'voice');
  const project = await projectRepository().load(path);
  const report = await generateVoices(path, project).run(project, showProgress);
  console.log(`${report.generated.length} gerada(s), ${report.skipped.length} já em dia`);
}

async function check([folder]: readonly string[]): Promise<void> {
  const project = await projectRepository().load(folderOf(folder, 'check'));
  const { errors, warnings } = checkProject().run(project);
  errors.forEach((error) => console.log(problemLine('ERRO', error)));
  warnings.forEach((warning) => console.log(problemLine('AVISO', warning)));
  console.log(`${errors.length} erro(s), ${warnings.length} aviso(s)`);
  if (errors.length > 0) process.exitCode = 1;
}

// The video props as JSON, for a still or the Studio (`--props=output/props.json --public-dir=<pasta>`).
async function build([folder]: readonly string[]): Promise<void> {
  const path = folderOf(folder, 'build');
  const props = await buildTimeline(path).run(await projectRepository().load(path));
  const file = join(path, 'output', 'props.json');
  await mkdir(join(path, 'output'), { recursive: true });
  await writeFile(file, JSON.stringify(props, null, 2), 'utf8');
  console.log(`linha do tempo: ${props.segments.length} fala(s), ${props.totalFrames} quadros → ${file}`);
}

async function render([folder]: readonly string[]): Promise<void> {
  const path = folderOf(folder, 'render');
  const files = await renderVideo(path).run(path, await projectRepository().load(path), renderProgress());
  console.log(`vídeo: ${files.video}\nlegendas: ${files.captions}`);
}

async function produce([folder]: readonly string[]): Promise<void> {
  const path = folderOf(folder, 'produce');
  const onWarning = (warning: Problem) => console.log(problemLine('AVISO', warning));
  const files = await produceVideo(path).run(path, { onWarning, onVoice: showProgress, onRender: renderProgress() });
  console.log(`vídeo: ${files.video}\nlegendas: ${files.captions}`);
}

// Without a cast JSON the sheet uses the rig defaults; the PNG goes to output/ in the current folder.
async function sheet([rig, character]: readonly string[]): Promise<void> {
  if (!rig) throw new UsageError('uso: giz sheet <rig> [personagem.json]');
  const name = character ? basename(character, extname(character)) : rig;
  const output = resolve('output', `sheet-${name}.png`);
  await characterSheet().render(rig, character && resolve(character), output);
  console.log(`ficha: ${output}`);
}

const SUBCOMMANDS: Readonly<Record<string, Subcommand>> = {
  voice, check, build, render, produce, sheet,
  setup: (args) => setupCommand(args), models: modelsCommand, gpu: gpuCommand, qa: qaCommand, sounds: soundsCommand,
  convert: convertCommand, keys: keysCommand, new: (args) => newCommand(args), script: (args) => scriptCommand(args),
  images: (args) => imagesCommand(args),
};

async function main([name = '', ...args]: readonly string[]): Promise<void> {
  const subcommand = SUBCOMMANDS[name];
  if (!subcommand) throw new UsageError(`uso: giz <${Object.keys(SUBCOMMANDS).join(' | ')}> [argumentos]`);
  await subcommand(args);
}

// Errors become a readable message, without a stack trace; a usage error exits with 2, the others with 1.
try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof UsageError ? 2 : 1;
}
