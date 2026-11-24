/** Lesson scenes: the fields of the motor scenes, in English. */
export const CARD_VARIANTS = ['objective', 'summary', 'challenge', 'next', 'ticket', 'rule'] as const;
export const CHART_CURVES = ['healthy', 'rotten'] as const;
export const TERMINAL_TONES = ['fail', 'ok', 'dim'] as const;
export const NODE_TONES = ['core', 'infrastructure', 'interface', 'soft'] as const;

type Side = Readonly<{ title: string; text: string }>;

export type TitleScene = Readonly<{ type: 'title'; overline: string; title: string; subtitle?: string }>;
export type CardScene = Readonly<{
  type: 'card';
  variant: (typeof CARD_VARIANTS)[number];
  title: string;
  items: readonly string[];
  shown?: number;
}>;
export type QuoteScene = Readonly<{ type: 'quote'; text: string }>;
export type ChartScene = Readonly<{
  type: 'chart';
  xAxisLabel: string;
  yAxisLabel: string;
  curves: readonly (typeof CHART_CURVES)[number][];
}>;
export type SymptomsScene = Readonly<{
  type: 'symptoms';
  items: readonly Readonly<{ name: string; description: string }>[];
  shown: number;
  focus?: number;
}>;
/** Embedded code; `added` are the indexes (0-based) of the new lines. */
export type CodeScene = Readonly<{
  type: 'code';
  title: string;
  lines: readonly string[];
  added?: readonly number[];
  highlight?: readonly string[];
}>;
export type TerminalScene = Readonly<{
  type: 'terminal';
  command: string;
  lines: readonly Readonly<{ text: string; tone?: (typeof TERMINAL_TONES)[number] }>[];
}>;
export type GraphNode = Readonly<{ id: string; label: string; x: number; y: number; tone?: (typeof NODE_TONES)[number] }>;
export type GraphEdge = Readonly<{ from: string; to: string; bad?: boolean }>;
export type GraphScene = Readonly<{
  type: 'graph';
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  focusOnBad?: boolean;
}>;
export type VersusScene = Readonly<{ type: 'versus'; wrong: Side; right: Side }>;
export type TableScene = Readonly<{
  type: 'table';
  title?: string;
  columns: readonly string[];
  rows: readonly Readonly<{ label: string; cells: readonly string[] }>[];
  shownRows?: number;
  highlightedColumn?: number;
  highlightedRow?: number;
}>;
export type TalkScene = Readonly<{ type: 'talk' }>;

export type LessonScene =
  | TitleScene
  | CardScene
  | QuoteScene
  | ChartScene
  | SymptomsScene
  | CodeScene
  | TerminalScene
  | GraphScene
  | VersusScene
  | TableScene
  | TalkScene;
