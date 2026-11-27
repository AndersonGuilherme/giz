import type { V1CodeSource } from './v1Lesson.ts';

/** Reads a file of the lesson `examples/` folder by its relative path. */
export type ExampleReader = (file: string) => string;

const linesOf = (text: string): string[] => text.replace(/\s+$/, '').split('\n');

function startOf(source: V1CodeSource, lines: readonly string[]): number {
  if (!source.from) return 0;
  const start = lines.findIndex((line) => line.includes(source.from!));
  if (start < 0) throw new Error(`"${source.from}" não encontrado em ${source.file}`);
  return start;
}

// The motor's diff: a line is new when it has text and its trimmed text is not in the other file.
function addedLines(lines: readonly string[], source: V1CodeSource, read: ExampleReader): number[] | undefined {
  if (!source.diffAgainst) return undefined;
  const before = new Set(linesOf(read(source.diffAgainst)).map((line) => line.trim()));
  return lines.flatMap((line, index) => (line.trim() !== '' && !before.has(line.trim()) ? [index] : []));
}

/** The v1 code-from-a-file scene as an inline v2 code scene: the file read from `from` on, the added lines, the highlights. */
export function inlineCode(source: V1CodeSource, read: ExampleReader): Readonly<Record<string, unknown>> {
  const all = linesOf(read(source.file));
  const lines = all.slice(startOf(source, all));
  const added = addedLines(lines, source, read);
  return { type: 'code', title: source.title ?? source.file, lines, ...(added ? { added } : {}), ...(source.highlight ? { highlight: source.highlight } : {}) };
}
