import { UsageError } from '../usage.ts';

const USAGE = 'uso: giz convert <pasta-da-aula-v1> <pasta-de-saida> | giz convert --in-place <pasta-da-aula-v1>...';

const inPlace = (lessons: readonly string[]) => lessons.map((lesson) => ({ lesson, output: lesson }));

function targetsOf(args: readonly string[]): { lesson: string; output: string }[] {
  if (args[0] === '--in-place' && args.length > 1) return inPlace(args.slice(1));
  const plain = args.length === 2 && args.every((arg) => !arg.startsWith('--'));
  if (!plain) throw new UsageError(USAGE);
  return [{ lesson: args[0]!, output: args[1]! }];
}

/** `giz convert`: a lesson of the old motor (roteiro.ts + examples/) becomes a v2 project; `--in-place` replaces roteiro.ts. */
export async function convertCommand(args: readonly string[]): Promise<void> {
  const targets = targetsOf(args);
  const { convertV1Lesson } = await import('../composition/convert.ts');
  for (const target of targets) {
    const { files, warnings } = await convertV1Lesson(target);
    warnings.forEach((warning) => console.log(`AVISO ${warning}`));
    console.log(`${target.lesson}: ${files.length} arquivo(s) → ${target.output}`);
  }
}
