type Fields = Readonly<Record<string, unknown>>;

const HAS_BEATS = /\[[^\]]+\]/;
// The first word (up to a space or a bracket), after any leading spaces.
const FIRST_WORD = /^(\s*)([^\s[\]]+)/;

// The beats follow the pronunciation when it has brackets, otherwise the text (the motor and v2 alike).
function beatField(line: Fields): 'pronunciation' | 'text' {
  const pronunciation = line.pronunciation;
  return typeof pronunciation === 'string' && HAS_BEATS.test(pronunciation) ? 'pronunciation' : 'text';
}

/**
 * The v1 `set` of a line that inherits its scene: scene changes applied when the line starts, which also restart the
 * scene animation. v2 has the same thing as a beat on the first word: the first word gets brackets and the changes
 * become the first beat; when a beat already opens the line, the changes go into it (that beat's own fields win, as in
 * the motor, where the beat came after the `set`).
 */
export function withStartChanges(line: Fields, changes: Fields): Fields {
  const field = beatField(line);
  const source = String(line[field]);
  const beats = (line.beats as readonly Fields[] | undefined) ?? [];
  if (source.trimStart().startsWith('[')) return { ...line, beats: [{ ...changes, ...beats[0] }, ...beats.slice(1)] };
  if (!FIRST_WORD.test(source)) throw new Error(`fala ${String(line.id)}: "set" numa fala sem palavras`);
  return { ...line, [field]: source.replace(FIRST_WORD, '$1[$2]'), beats: [changes, ...beats] };
}
