// What a folded line shows in its one row: the start of its text, its beats, the scene it opens and its problems.
import type { EditorProblem, LineJson } from '../../shared/script.ts';

const EXCERPT_LENGTH = 80;

/** The text on one line, cut on a word near 80 characters (a single long word is cut where it must be). */
export function excerptOf(text: string, length = EXCERPT_LENGTH): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= length) return flat;
  const cut = flat.slice(0, length);
  const space = cut.lastIndexOf(' ');
  return `${(space > length / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

export const beatCountOf = (line: LineJson): number => (Array.isArray(line.beats) ? line.beats.length : 0);

/** The type of the scene the line opens, or null when it goes on with the scene before. */
export function sceneTypeOf(line: LineJson): string | null {
  const scene = line.scene as Readonly<{ type?: unknown }> | undefined;
  return scene && typeof scene.type === 'string' ? scene.type : null;
}

export const problemCountOf = (problems: readonly EditorProblem[], index: number): number => problems.filter(({ line }) => line === index).length;

/** Chalk colors for the speakers' chips, by their place in the cast (they go round when the cast is bigger). */
export const SPEAKER_COLORS = ['#f2c14e', '#7fc8a9', '#8fb8ef', '#e8735a', '#c9a0dc', '#e9d8a6'] as const;

export function chipColorOf(cast: readonly string[], speaker: string): string | null {
  const place = cast.indexOf(speaker);
  return place < 0 ? null : SPEAKER_COLORS[place % SPEAKER_COLORS.length]!;
}
