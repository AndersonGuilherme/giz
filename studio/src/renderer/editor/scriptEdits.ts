import type { LineJson, ScriptJson } from '../../shared/script.ts';

type Line = LineJson;

const replaced = (script: ScriptJson, lines: readonly Line[]): ScriptJson => ({ ...script, lines });

/** A change of one field of one line: `value` undefined removes the field (an empty optional field is absent). */
export type FieldChange = Readonly<{ index: number; field: string; value: unknown }>;

export function withField(script: ScriptJson, { index, field, value }: FieldChange): ScriptJson {
  return replaced(script, script.lines.map((line, at) => (at === index ? lineWith(line, field, value) : line)));
}

const without = (line: Line, field: string): Line => Object.fromEntries(Object.entries(line).filter(([key]) => key !== field)) as Line;

function lineWith(line: Line, field: string, value: unknown): Line {
  return (value === undefined ? without(line, field) : { ...line, [field]: value }) as Line;
}

// Numbered ids ("01", "02"...) go on counting with the same width; anything else gets the first free number.
export function nextLineId(script: ScriptJson): string {
  const ids = script.lines.map(({ id }) => String(id));
  const numbers = ids.filter((id) => /^\d+$/.test(id));
  const width = Math.max(2, ...numbers.map((id) => id.length));
  const free = (candidate: number): string => {
    const id = String(candidate).padStart(width, '0');
    return ids.includes(id) ? free(candidate + 1) : id;
  };
  return free(Math.max(0, ...numbers.map(Number)) + 1);
}

/** A new line after `after` (−1: at the start), in the same chapter and with the same speaker as the line before it. */
export function addLine(script: ScriptJson, after: number, text: string): ScriptJson {
  const near = script.lines[Math.max(after, 0)];
  const line = { id: nextLineId(script), chapter: near?.chapter ?? 1, speaker: near?.speaker ?? '', text } as Line;
  return replaced(script, [...script.lines.slice(0, after + 1), line, ...script.lines.slice(after + 1)]);
}

/** A copy right after the line, with a new id and without the scene (the copy continues the scene). */
export function duplicateLine(script: ScriptJson, index: number): ScriptJson {
  const line = script.lines[index];
  if (!line) return script;
  const lines = [...script.lines];
  lines.splice(index + 1, 0, { ...without(line, 'scene'), id: nextLineId(script) } as Line);
  return replaced(script, lines);
}

export function removeLine(script: ScriptJson, index: number): ScriptJson {
  return replaced(script, script.lines.filter((_line, at) => at !== index));
}

/** The line taken from `from` and put at `to` (both indexes of the list before the move). */
export function moveLine(script: ScriptJson, from: number, to: number): ScriptJson {
  const line = script.lines[from];
  if (!line || to < 0 || to >= script.lines.length || from === to) return script;
  const rest = script.lines.filter((_line, at) => at !== from);
  return replaced(script, [...rest.slice(0, to), line, ...rest.slice(to)]);
}

export function renameChapter(script: ScriptJson, index: number, name: string): ScriptJson {
  return { ...script, chapters: script.chapters.map((chapter, at) => (at === index ? name : chapter)) };
}

export function addChapter(script: ScriptJson, name: string): ScriptJson {
  return { ...script, chapters: [...script.chapters, name] };
}

/** The chapter goes; its lines join the chapter before it (the first one's join the next), the later ones count down. */
export function removeChapter(script: ScriptJson, index: number): ScriptJson {
  const removed = index + 1;
  const chapterOf = (chapter: number) => (chapter > removed || (chapter === removed && removed > 1) ? chapter - 1 : chapter);
  const lines = script.lines.map((line) => ({ ...line, chapter: chapterOf(Number(line.chapter)) }));
  return { chapters: script.chapters.filter((_chapter, at) => at !== index), lines };
}
