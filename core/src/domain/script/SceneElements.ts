/** Data (JSON) of the elements of a scenario; the behavior comes in Tasks 7 and 12. */
export type Point = Readonly<{ x: number; y: number }>;

export type Framing = Readonly<{ x: number; y: number; zoom: number }>;

export const MOVE_TYPES = ['still', 'zoom-in', 'zoom-out', 'pan', 'follow', 'shake'] as const;
export const EASINGS = ['linear', 'smooth'] as const;

export type CameraMoveJson = Readonly<{
  type: (typeof MOVE_TYPES)[number];
  from?: Framing;
  to?: Framing;
  target?: string;
  intensity?: number;
  easing?: (typeof EASINGS)[number];
}>;

export const EFFECT_TYPES = ['vignette', 'glow', 'particles', 'fire', 'rain', 'snow', 'tint'] as const;

export type Effect = Readonly<{
  type: (typeof EFFECT_TYPES)[number];
  intensity?: number;
  color?: string;
  position?: Point;
}>;

export type HudField = Readonly<{ label: string; value: string }>;

/** `bar.value` goes from 0 to 100. */
export type Hud = Readonly<{
  fields: readonly HudField[];
  bar?: Readonly<{ label: string; value: number }>;
}>;

export const TEXT_ENTRANCES = ['pop', 'rise'] as const;

export type BigText = Readonly<{ text: string; color?: string; entrance?: (typeof TEXT_ENTRANCES)[number] }>;
