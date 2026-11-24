// Sequence alignment (Needleman-Wunsch) between the script words and the heard ones, already normalized.
// Besides the 1:1 pair, it accepts two script words in one heard word ("pull request" → "pullrequest") and one script word
// in two heard words ("deploy" → "the ploy"). The order of both sequences is always kept.
import { similarity } from './Similarity.ts';

/** Slice [start, end) of a sequence. */
export type Range = Readonly<{ start: number; end: number }>;
export type Pair = Readonly<{ script: Range; heard: Range }>;
type Sequences = Readonly<{ script: readonly string[]; heard: readonly string[] }>;
type Step = Readonly<{ script: number; heard: number }>;
type Cell = Readonly<{ points: number; step: Step | undefined }>;

const STEPS: readonly Step[] = [
  { script: 1, heard: 1 },
  { script: 2, heard: 1 },
  { script: 1, heard: 2 },
  { script: 1, heard: 0 },
  { script: 0, heard: 1 },
];
const MINIMUM_SIMILARITY = 0.5;
// Joining two script words is worth double; without this requirement, "eu sou" would swallow a lone "sou".
const MINIMUM_SIMILARITY_WHEN_JOINING = 0.8;
const ORIGIN: Cell = { points: 0, step: undefined };
const IMPOSSIBLE: Cell = { points: -Infinity, step: undefined };

// Points of a step that ends at (row, column): skips are worth 0; pairs are worth the similarity per script word.
function stepPoints(step: Step, end: Readonly<{ row: number; column: number }>, sequences: Sequences): number {
  if (step.script === 0 || step.heard === 0) return 0;
  const fromScript = sequences.script.slice(end.row - step.script, end.row).join('');
  const heardText = sequences.heard.slice(end.column - step.heard, end.column).join('');
  const score = similarity(fromScript, heardText);
  const minimum = step.script > 1 ? MINIMUM_SIMILARITY_WHEN_JOINING : MINIMUM_SIMILARITY;
  return score < minimum ? -Infinity : score * step.script;
}

function bestCell(table: readonly Cell[][], end: Readonly<{ row: number; column: number }>, sequences: Sequences): Cell {
  if (end.row === 0 && end.column === 0) return ORIGIN;
  const possible = STEPS.filter((step) => step.script <= end.row && step.heard <= end.column);
  return possible.reduce((best, step) => {
    const previous = table[end.row - step.script]?.[end.column - step.heard] ?? IMPOSSIBLE;
    const points = previous.points + stepPoints(step, end, sequences);
    return points > best.points ? { points, step } : best;
  }, IMPOSSIBLE);
}

function fillRow(table: Cell[][], row: number, sequences: Sequences): void {
  const cells: Cell[] = [];
  table.push(cells);
  for (let column = 0; column <= sequences.heard.length; column++) cells.push(bestCell(table, { row, column }, sequences));
}

function stepPair(step: Step, row: number, column: number): Pair[] {
  if (step.script === 0 || step.heard === 0) return [];
  return [{ script: { start: row - step.script, end: row }, heard: { start: column - step.heard, end: column } }];
}

// Walks back from the end to the start of the table along the best path, keeping only the pairs.
function path(table: readonly Cell[][], sequences: Sequences): Pair[] {
  const pairs: Pair[] = [];
  let row = sequences.script.length;
  let column = sequences.heard.length;
  for (let step = table[row]?.[column]?.step; step; step = table[row]?.[column]?.step) {
    pairs.unshift(...stepPair(step, row, column));
    row -= step.script;
    column -= step.heard;
  }
  return pairs;
}

/** The pairs (in order) of the best alignment between the script words and the heard ones. */
export function alignSequences(script: readonly string[], heard: readonly string[]): Pair[] {
  const sequences = { script, heard };
  const table: Cell[][] = [];
  for (let row = 0; row <= script.length; row++) fillRow(table, row, sequences);
  return path(table, sequences);
}
