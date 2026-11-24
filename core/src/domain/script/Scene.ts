import type { LessonScene } from './LessonScenes.ts';
import type { Effect, Hud, CameraMoveJson, Point, BigText } from './SceneElements.ts';

export const NAMED_POSITIONS = ['left', 'center', 'right'] as const;
export const DIRECTIONS = ['front', 'left', 'right'] as const;

export type CharacterInScene = Readonly<{
  character: string;
  position: (typeof NAMED_POSITIONS)[number] | Point;
  scale?: number;
  direction?: (typeof DIRECTIONS)[number];
}>;

export type Background = Readonly<{ image?: string; vector?: string; colors?: Readonly<Record<string, string>> }>;

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
