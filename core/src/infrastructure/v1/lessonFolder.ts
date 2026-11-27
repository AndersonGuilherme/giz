import { readFileSync } from 'node:fs';
import { access, copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { convertLesson, type V1VoiceSettings } from './convertLesson.ts';
import type { V1Lesson, V1Speaker } from './v1Lesson.ts';

/** Where the conversion reads the presenters (Lia and Téo, `casts/example/`) and the voices of the install. */
export type ConversionSetup = Readonly<{ castFolder: string; voice: V1VoiceSettings }>;
export type ConversionTarget = Readonly<{ lesson: string; output: string }>;
export type ConversionReport = Readonly<{ files: readonly string[]; warnings: readonly string[] }>;

const V1_SCRIPT = 'roteiro.ts';
// The course dictionaries (`pronuncia.json`, `pronuncia.<service>.json`, in the course folder two levels up) become the
// project ones: `pronunciation.json` for Qwen and `pronunciation.<service>.json` for the others.
const V1_LEXICON = /^pronuncia((?:\.[\w-]+)?)\.json$/;

const exists = (path: string) => access(path).then(() => true, () => false);
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

// The v1 script is a TypeScript module exporting `lesson` (only type imports, which Node strips).
async function loadLesson(folder: string): Promise<V1Lesson> {
  const module = (await import(pathToFileURL(join(folder, V1_SCRIPT)).href)) as { lesson?: V1Lesson };
  if (!module.lesson) throw new Error(`${join(folder, V1_SCRIPT)}: não exporta "lesson"`);
  return module.lesson;
}

async function readCasts(folder: string): Promise<Record<V1Speaker, Record<string, unknown>>> {
  const read = async (id: V1Speaker) => JSON.parse(await readFile(join(folder, `${id}.json`), 'utf8')) as Record<string, unknown>;
  return { lia: await read('lia'), teo: await read('teo') };
}

async function copyLexicons(lesson: string, output: string): Promise<string[]> {
  const course = resolve(lesson, '..', '..');
  const names = (await readdir(course)).filter((name) => V1_LEXICON.test(name));
  const copied = names.map((name) => ({ from: join(course, name), to: join(output, name.replace(V1_LEXICON, 'pronunciation$1.json')) }));
  await Promise.all(copied.map(({ from, to }) => copyFile(from, to)));
  return copied.map(({ to }) => to);
}

async function rejectConverted(output: string): Promise<void> {
  const script = join(output, 'script.json');
  if (await exists(script)) throw new Error(`${script} já existe: a pasta já tem um projeto v2`);
}

/**
 * Converts the v1 lesson folder (`roteiro.ts` and `examples/`) into a v2 project in `output`: project.json, script.json,
 * cast/ and the pronunciation dictionaries. With the same folder as output, `roteiro.ts` is removed at the end.
 */
export async function convertLessonFolder(target: ConversionTarget, setup: ConversionSetup): Promise<ConversionReport> {
  const lesson = resolve(target.lesson);
  const output = resolve(target.output);
  await rejectConverted(output);
  const read = (file: string) => readFileSync(join(lesson, 'examples', file), 'utf8');
  const converted = convertLesson(await loadLesson(lesson), { read, casts: await readCasts(setup.castFolder), voice: setup.voice });
  await mkdir(join(output, 'cast'), { recursive: true });
  const files = { 'project.json': converted.project, 'script.json': converted.script, 'cast/lia.json': converted.cast.lia, 'cast/teo.json': converted.cast.teo };
  const written = Object.keys(files).map((name) => join(output, name));
  await Promise.all(Object.entries(files).map(([name, content]) => writeFile(join(output, name), json(content), 'utf8')));
  const lexicons = await copyLexicons(lesson, output);
  if (lesson === output) await rm(join(lesson, V1_SCRIPT));
  return { files: [...written, ...lexicons], warnings: converted.warnings };
}
