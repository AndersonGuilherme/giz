import type { ExampleReader } from './v1Code.ts';
import type { V1Cue, V1Lesson, V1Speaker } from './v1Lesson.ts';
import { beatOf, lineOf } from './v1Lines.ts';
import { withStartChanges } from './v1SetBeat.ts';

type Fields = Readonly<Record<string, unknown>>;
type VoiceModel = '0.6b' | '1.7b';

/** The voice of each presenter (gizzycera.config.json `voices`, `styles` and `model`, as the motor used them). */
export type V1VoiceSettings = Readonly<{
  voices: Readonly<Record<V1Speaker, string>>;
  styles: Readonly<Record<V1Speaker, string>>;
  model: VoiceModel;
}>;

/** What the conversion needs besides the lesson: its example files, the Lia and Téo cast files and the voices. */
export type V1Sources = Readonly<{ read: ExampleReader; casts: Readonly<Record<V1Speaker, Fields>>; voice: V1VoiceSettings }>;

/** A v2 project as JSON: project.json, script.json and cast/<id>.json, plus what did not carry over. */
export type ConvertedLesson = Readonly<{
  project: Fields; script: Fields; cast: Readonly<Record<V1Speaker, Fields>>; warnings: readonly string[];
}>;

const SPEAKERS: readonly V1Speaker[] = ['lia', 'teo'];

// The scene kind on screen after each cue: its own scene or the inherited one.
function kindsBefore(cues: readonly V1Cue[]): (string | undefined)[] {
  return cues.reduce<(string | undefined)[]>((kinds, cue, index) => [...kinds, cues[index - 1]?.scene?.kind ?? kinds.at(-1)], []);
}

function lineFor(cue: V1Cue, context: Readonly<{ read: ExampleReader; kind: string | undefined; warn: (message: string) => void }>): Fields {
  const line = lineOf(cue, context);
  if (!cue.set || cue.scene) return line;
  return withStartChanges(line, beatOf(cue.set, context.kind));
}

function castOf(speaker: V1Speaker, sources: V1Sources): Fields {
  const base = sources.casts[speaker];
  const style = sources.voice.model === '1.7b' ? sources.voice.styles[speaker] : '';
  const voice = { ...(base.voice as Fields | undefined), id: sources.voice.voices[speaker], ...(style ? { style } : {}) };
  return { ...base, voice };
}

function projectOf(lesson: V1Lesson, model: VoiceModel): Fields {
  return {
    version: 2, title: lesson.title, format: 'lesson', language: 'pt-BR', aspect: '16:9', captionStyle: 'blocks',
    cast: [...SPEAKERS], voice: { provider: 'qwen', model },
  };
}

/** A v1 lesson (the motor's `roteiro.ts`) as a v2 project: 16:9 lesson, block captions, Lia and Téo, inline code. */
export function convertLesson(lesson: V1Lesson, sources: V1Sources): ConvertedLesson {
  const warnings: string[] = [];
  const kinds = kindsBefore(lesson.cues);
  const warn = (message: string) => warnings.push(message);
  const lines = lesson.cues.map((cue, index) => lineFor(cue, { read: sources.read, kind: cue.scene?.kind ?? kinds[index], warn }));
  const cast = Object.fromEntries(SPEAKERS.map((speaker) => [speaker, castOf(speaker, sources)])) as Record<V1Speaker, Fields>;
  return { project: projectOf(lesson, sources.voice.model), script: { chapters: [...lesson.chapters], lines }, cast, warnings };
}
