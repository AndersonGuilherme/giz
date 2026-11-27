import type { V1Scene } from './v1Lesson.ts';

type Fields = Readonly<Record<string, unknown>>;
type Translate = (value: unknown) => unknown;

// v1 field → v2 field, by scene kind (the fields not listed keep their name).
const RENAMES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  title: { eyebrow: 'overline' },
  chart: { xLabel: 'xAxisLabel', yLabel: 'yAxisLabel' },
  graph: { focusBad: 'focusOnBad' },
  table: { highlightCol: 'highlightedColumn', highlightRow: 'highlightedRow' },
};

const NODE_TONES: Fields = { ui: 'interface', infra: 'infrastructure' };
const TERMINAL_TONES: Fields = { muted: 'dim' };

const listOf = (value: unknown): Fields[] => (Array.isArray(value) ? (value as Fields[]) : []);
const withTone = (tones: Fields): Translate => (value) =>
  listOf(value).map((item) => (item.tone === undefined ? item : { ...item, tone: tones[String(item.tone)] ?? item.tone }));
const symptomItems: Translate = (value) => listOf(value).map(({ desc, ...item }) => ({ ...item, description: desc }));

// v1 values that changed shape or names in v2, by scene kind and (v1) field.
const VALUES: Readonly<Record<string, Readonly<Record<string, Translate>>>> = {
  graph: { nodes: withTone(NODE_TONES) },
  terminal: { lines: withTone(TERMINAL_TONES) },
  symptoms: { items: symptomItems },
};

function translated(kind: string, [field, value]: [string, unknown]): [string, unknown] {
  const name = RENAMES[kind]?.[field] ?? field;
  const translate = VALUES[kind]?.[field];
  return [name, translate ? translate(value) : value];
}

/** Scene fields of a v1 scene of `kind` (a whole scene, a `set` or the scene part of a beat) with the v2 names. */
export function sceneFields(kind: string, fields: Fields): Fields {
  const present = Object.entries(fields).filter(([, value]) => value !== undefined);
  return Object.fromEntries(present.map((entry) => translated(kind, entry)));
}

/** A v1 scene (other than code from a file, see v1Code.ts) as a v2 scene: `kind` becomes `type`. */
export function sceneOf(scene: V1Scene): Fields {
  const { kind, ...fields } = scene;
  return { type: kind, ...sceneFields(kind, fields) };
}
