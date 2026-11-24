// Comparing heard words with script words: no accents, no punctuation and lowercase.

/** "Olá," → "ola"; "pull-request" → "pullrequest". */
export function normalize(text: string): string {
  const unaccented = text.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return unaccented.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

const at = (list: readonly number[], index: number) => list[index] ?? 0;

// One row of the Levenshtein table, from the previous one.
function nextRow(previous: readonly number[], letter: string, other: string): number[] {
  const row = [at(previous, 0) + 1];
  for (let column = 1; column <= other.length; column++) {
    const substitution = at(previous, column - 1) + (other[column - 1] === letter ? 0 : 1);
    row.push(Math.min(at(previous, column) + 1, at(row, column - 1) + 1, substitution));
  }
  return row;
}

function distance(one: string, other: string): number {
  const first = [...Array(other.length + 1).keys()];
  const last = [...one].reduce((row, letter) => nextRow(row, letter, other), first);
  return last[other.length] ?? 0;
}

/** From 0 (nothing in common) to 1 (equal), by the edit distance between the letters. */
export function similarity(one: string, other: string): number {
  const larger = Math.max(one.length, other.length);
  return larger === 0 ? 1 : 1 - distance(one, other) / larger;
}
