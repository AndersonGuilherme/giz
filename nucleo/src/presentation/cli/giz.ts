// Usage: node src/presentation/cli/giz.ts <subcommand> [arguments]
import { resolve } from 'node:path';
import type { Progress } from '../../application/use-cases/GenerateVoices.ts';
import type { Problem } from '../../application/use-cases/CheckProject.ts';
import { generateVoices, projectRepository, checkProject } from './composition.ts';

type Subcommand = (args: readonly string[]) => Promise<void>;

class UsageError extends Error {}

function showProgress({ done, total, lineId, generated }: Progress): void {
  console.log(`fala ${lineId} (${done}/${total}): ${generated ? 'voz gerada' : 'já em dia'}`);
}

async function voice([folder]: readonly string[]): Promise<void> {
  if (!folder) throw new UsageError('uso: giz voice <pasta-do-projeto>');
  const path = resolve(folder);
  const project = await projectRepository().load(path);
  const report = await generateVoices(path, project).run(project, showProgress);
  console.log(`${report.generated.length} gerada(s), ${report.skipped.length} já em dia`);
}

function problemLine(level: 'ERRO' | 'AVISO', { line, message }: Problem): string {
  return line ? `${level} fala ${line}: ${message}` : `${level}: ${message}`;
}

async function check([folder]: readonly string[]): Promise<void> {
  if (!folder) throw new UsageError('uso: giz check <pasta-do-projeto>');
  const project = await projectRepository().load(resolve(folder));
  const { errors, warnings } = checkProject().run(project);
  errors.forEach((error) => console.log(problemLine('ERRO', error)));
  warnings.forEach((warning) => console.log(problemLine('AVISO', warning)));
  console.log(`${errors.length} erro(s), ${warnings.length} aviso(s)`);
  if (errors.length > 0) process.exitCode = 1;
}

const SUBCOMMANDS: Readonly<Record<string, Subcommand>> = { voice, check };

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
