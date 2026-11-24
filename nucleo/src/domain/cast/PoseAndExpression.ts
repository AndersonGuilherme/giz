export const POSES = [
  'neutral', 'explain', 'point', 'wave', 'raise', 'think', 'shrug', 'celebrate', 'hand-on-head', 'hands-on-mouth',
] as const;
export type Pose = (typeof POSES)[number];

export const EXPRESSIONS = [
  'neutral', 'happy', 'excited', 'surprised', 'confused', 'thinking', 'skeptical', 'worried', 'angry', 'scared',
] as const;
export type Expression = (typeof EXPRESSIONS)[number];
