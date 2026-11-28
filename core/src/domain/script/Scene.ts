import type { LessonScene } from './LessonScenes.ts';
import type { ImageStyle } from '../scenario/ImageStyle.ts';
import type { ImageCropJson } from '../scenario/ImageCrop.ts';
import type { Effect, Hud, CameraMoveJson, Point, BigText } from './SceneElements.ts';

export const NAMED_POSITIONS = ['left', 'center', 'right'] as const;
export const DIRECTIONS = ['front', 'left', 'right'] as const;

export type CharacterInScene = Readonly<{
  character: string;
  position: (typeof NAMED_POSITIONS)[number] | Point;
  scale?: number;
  direction?: (typeof DIRECTIONS)[number];
}>;

/** A scenario image to make with an image AI: what to show and, optionally, a style other than the project's. */
export type BackgroundRequest = Readonly<{ prompt: string; style?: ImageStyle }>;

export type Background = Readonly<{
  image?: string;
  vector?: string;
  colors?: Readonly<Record<string, string>>;
  /** Only on a scene (not on a beat): `gizzy images` makes the image and points `image` to it. */
  generate?: BackgroundRequest;
  /** The part of the image shown (the Studio's "recortar enquadramento"); the file itself is never changed. */
  crop?: ImageCropJson;
}>;

export type ScenarioScene = Readonly<{
  type: 'scenario';
  background: Background;
  characters: readonly CharacterInScene[];
  camera?: CameraMoveJson;
  effects?: readonly Effect[];
  hud?: Hud;
  highlight?: BigText;
}>;

export type Scene = ScenarioScene | LessonScene;
