import type { Background } from '../script/Scene.ts';

export const VECTOR_BACKGROUNDS = ['room', 'street', 'field', 'night-sky', 'lab', 'village'] as const;
export type VectorBackground = (typeof VECTOR_BACKGROUNDS)[number];

/** `colors` override the palette of the vector background, color by color. */
export type BackgroundChoice =
  | Readonly<{ kind: 'image'; image: string; vector?: undefined }>
  | Readonly<{ kind: 'vector'; vector: VectorBackground; colors: Readonly<Record<string, string>> }>;

const FALLBACK: VectorBackground = 'room';

const isKnown = (name: string | undefined): name is VectorBackground => VECTOR_BACKGROUNDS.some((known) => known === name);

/** What a scenario draws behind the characters: its image, or the vector background (`room` when the image fails to load). */
export class BackgroundSource {
  static for(background: Background, status: Readonly<{ imageFailed: boolean }>): BackgroundChoice {
    if (background.image && !status.imageFailed) return { kind: 'image', image: background.image };
    const vector = isKnown(background.vector) ? background.vector : FALLBACK;
    return { kind: 'vector', vector, colors: background.colors ?? {} };
  }
}
