import type { Background } from '../script/Scene.ts';
import type { ImageCropJson } from './ImageCrop.ts';

// The first six are the everyday settings; the others, a setting per era or mood (past, present, future, spooky).
export const VECTOR_BACKGROUNDS = [
  'room', 'street', 'field', 'night-sky', 'lab', 'village',
  'cave', 'ancient-egypt', 'ancient-rome', 'medieval-castle', 'pirate-ship', 'victorian-street', 'fifties-diner',
  'classroom', 'office', 'city-night', 'space-station', 'cyber-city', 'graveyard', 'haunted-house',
] as const;
export type VectorBackground = (typeof VECTOR_BACKGROUNDS)[number];

/** `colors` override the palette of the vector background, color by color; `crop`: the part of the picture shown. */
export type BackgroundChoice =
  | Readonly<{ kind: 'image'; image: string; vector?: undefined; crop?: ImageCropJson }>
  | Readonly<{ kind: 'vector'; vector: VectorBackground; colors: Readonly<Record<string, string>> }>;

const FALLBACK: VectorBackground = 'room';

const isKnown = (name: string | undefined): name is VectorBackground => VECTOR_BACKGROUNDS.some((known) => known === name);

/** What a scenario draws behind the characters: its image, or the vector background (`room` when the image fails to load). */
export class BackgroundSource {
  static for(background: Background, status: Readonly<{ imageFailed: boolean }>): BackgroundChoice {
    if (background.image && !status.imageFailed) return { kind: 'image', image: background.image, ...(background.crop ? { crop: background.crop } : {}) };
    return { kind: 'vector', vector: BackgroundSource.vectorFor(background.vector), colors: background.colors ?? {} };
  }

  /** The vector background drawn for a name: the named one, or `room` when the name is absent or unknown. */
  static vectorFor(name: string | undefined): VectorBackground {
    return isKnown(name) ? name : FALLBACK;
  }
}
