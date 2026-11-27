/** A scene as JSON (core's script schema says what each type needs). */
export type SceneJson = Readonly<Record<string, unknown>> & Readonly<{ type: string }>;

type Template = (bodies: readonly string[]) => SceneJson;

// A new scene of each type starts with what its form edits; the types without a form start with the type alone and
// the raw JSON editor says what is missing.
const TEMPLATES: Readonly<Record<string, Template>> = {
  scenario: (bodies) => ({ type: 'scenario', background: { vector: 'room' }, characters: bodies.slice(0, 1).map((character) => ({ character, position: 'center' })) }),
  title: () => ({ type: 'title', overline: '', title: '' }),
  card: () => ({ type: 'card', variant: 'objective', title: '', items: [], shown: 0 }),
  quote: () => ({ type: 'quote', text: '' }),
  code: () => ({ type: 'code', title: '', lines: [] }),
  terminal: () => ({ type: 'terminal', command: '', lines: [] }),
  talk: () => ({ type: 'talk' }),
};

/** A new scene of the type; `bodies`: the cast members with a body (a scenario puts the first one on stage). */
export function sceneTemplate(type: string, bodies: readonly string[]): SceneJson {
  return TEMPLATES[type]?.(bodies) ?? { type };
}

/** The scene the format starts a new scene with: a scenario in a story, a talk in a lesson. */
export const defaultSceneType = (format: string): string => (format === 'lesson' ? 'talk' : 'scenario');

export const isScene = (value: unknown): value is SceneJson =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as { type?: unknown }).type === 'string';

/** The text lines of a list field as one text, a line each (the forms edit lists in a text area). */
export const linesText = (value: unknown): string => (Array.isArray(value) ? value.map(String).join('\n') : '');
export const textLines = (text: string): readonly string[] => (text === '' ? [] : text.split('\n'));
