// The v1 lesson format (the old motor's `roteiro.ts`, `motor/src/types.ts`), only as the converter reads it: the field
// names are the v1 ones on purpose. Nothing outside infrastructure/v1 knows this format.

export type V1Speaker = 'lia' | 'teo';

export type V1CodeSource = Readonly<{
  kind: 'code';
  file: string; // relative to examples/
  from?: string; // first line that contains this text (default: the start of the file)
  title?: string;
  diffAgainst?: string; // lines not in this file are marked as added
  highlight?: readonly string[];
}>;

/** Any v1 scene: `kind` plus its fields (the converter maps them by kind). */
export type V1Scene = Readonly<Record<string, unknown> & { kind: string }>;

export type V1Beat = Readonly<Record<string, unknown> & { expr?: string; pose?: string; sfx?: string }>;

export type V1Reaction = Readonly<{ expr?: string; pose?: string; look?: string }>;

export type V1Cue = Readonly<{
  id: string;
  chapter: number;
  speaker: V1Speaker;
  text: string;
  say?: string;
  pose?: string;
  expr?: string;
  look?: string;
  react?: V1Reaction;
  speed?: number;
  style?: string;
  hold?: Readonly<{ seconds: number; label: string }>;
  read?: number | false;
  sfx?: string;
  scene?: V1Scene;
  set?: Readonly<Record<string, unknown>>;
  beats?: readonly V1Beat[];
}>;

export type V1Lesson = Readonly<{
  course: string;
  number: string;
  slug: string;
  title: string;
  chapters: readonly string[];
  cues: readonly V1Cue[];
}>;
