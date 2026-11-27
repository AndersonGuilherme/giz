import { inlineCode, type ExampleReader } from './v1Code.ts';
import type { V1Beat, V1CodeSource, V1Cue, V1Reaction } from './v1Lesson.ts';
import { sceneFields, sceneOf } from './v1Scenes.ts';

type Fields = Readonly<Record<string, unknown>>;
/** What converting a cue needs: the examples, the kind of the scene on screen so far and where warnings go. */
export type CueContext = Readonly<{ read: ExampleReader; kind: string | undefined; warn: (message: string) => void }>;

// v1 names that v2 changed: the "concerned" face is v2 "worried"; looking at the "viewer" is v2 "camera".
const EXPRESSIONS: Readonly<Record<string, string>> = { concerned: 'worried' };
const GAZES: Readonly<Record<string, string>> = { viewer: 'camera' };
const expressionOf = (expr: string | undefined) => (expr === undefined ? undefined : EXPRESSIONS[expr] ?? expr);
const gazeOf = (look: string | undefined) => (look === undefined ? undefined : GAZES[look] ?? look);
const defined = (fields: Fields): Fields => Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

// The motor dropped `<pausa N>` before the voice and the captions (punctuation sets the pace): so does the conversion.
const PAUSE = /<pausa\s+[\d.]+>/g;
export const withoutPauses = (text: string): string => text.replace(PAUSE, '').replace(/\s{2,}/g, ' ').trim();

function reactionOf(react: V1Reaction | undefined): Fields | undefined {
  if (!react) return undefined;
  return defined({ expression: expressionOf(react.expr), pose: react.pose, look: gazeOf(react.look) });
}

/** A v1 beat: its character fields renamed and its scene fields translated for the scene on screen. */
export function beatOf(beat: V1Beat, kind: string | undefined): Fields {
  const { expr, pose, sfx, ...scene } = beat;
  return { ...sceneFields(kind ?? '', scene), ...defined({ expression: expressionOf(expr), pose, sfx }) };
}

// A line that opens a scene takes its `set` right away (the motor merged it into the new scene).
function sceneOfCue(cue: V1Cue, read: ExampleReader): Fields | undefined {
  if (!cue.scene) return undefined;
  const merged = { ...cue.scene, ...cue.set };
  return merged.kind === 'code' ? inlineCode(merged as unknown as V1CodeSource, read) : sceneOf(merged);
}

function warnings(cue: V1Cue, context: CueContext): void {
  if (cue.speed !== undefined) context.warn(`fala ${cue.id}: "speed" ignorado (não tinha efeito com o Qwen3-TTS)`);
  if (cue.style !== undefined) context.warn(`fala ${cue.id}: "style" da fala ignorado (a v2 usa o estilo do elenco)`);
}

/** A v1 cue as a v2 line (before the `set` of a line that inherits its scene: see v1SetBeat.ts). */
export function lineOf(cue: V1Cue, context: CueContext): Fields {
  warnings(cue, context);
  const scene = sceneOfCue(cue, context.read);
  const kind = cue.scene?.kind ?? context.kind;
  return defined({
    id: cue.id, chapter: cue.chapter, speaker: cue.speaker,
    expression: expressionOf(cue.expr), pose: cue.pose, look: gazeOf(cue.look), reaction: reactionOf(cue.react),
    scene, text: withoutPauses(cue.text), pronunciation: cue.say === undefined ? undefined : withoutPauses(cue.say),
    beats: cue.beats?.map((beat) => beatOf(beat, kind)), holdAfter: cue.hold, reading: cue.read, sfx: cue.sfx,
  });
}
