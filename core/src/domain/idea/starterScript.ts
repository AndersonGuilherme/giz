import { defaultVoiceStyle } from '../cast/voiceStyles.ts';
import { Placement } from '../scenario/Placement.ts';
import type { NAMED_POSITIONS } from '../script/Scene.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Language } from '../values/Language.ts';

/** What a script written by hand starts with: a chapter, a first line to replace and the narrator's name. */
export type StarterTexts = Readonly<{ chapter: string; line: string; narrator: string; personality: string }>;

const TEXTS: Readonly<Record<ReturnType<Language['code']>, StarterTexts>> = {
  'pt-BR': { chapter: 'Começo', line: 'Escreva aqui a primeira fala.', narrator: 'Narrador', personality: 'narrador, sem corpo' },
  en: { chapter: 'Beginning', line: 'Write the first line here.', narrator: 'Narrator', personality: 'narrator without a body' },
};

/** The id of the voice without a body every hand-written project starts with. */
export const NARRATOR_ID = 'narrator';
// A calm local (Qwen) voice that every example narrator uses.
const NARRATOR_VOICE = 'ryan';
const TITLE_LENGTH = 80;
type Named = (typeof NAMED_POSITIONS)[number];
// Where one, two or three characters stand: in the middle, facing each other, or left to right.
const POSITIONS: readonly (readonly Named[])[] = [[], ['center'], ['left', 'right'], ['left', 'center', 'right']];

export function starterTexts(language: Language): StarterTexts {
  return TEXTS[language.code()];
}

/** The project title from the theme: its first line, cut on a word when it is longer than 80 characters. */
export function starterTitle(theme: string): string {
  const first = theme.trim().split('\n')[0]!.trim();
  if (first.length <= TITLE_LENGTH) return first;
  const cut = first.slice(0, TITLE_LENGTH - 1);
  const word = cut.lastIndexOf(' ');
  return `${(word > 0 ? cut.slice(0, word) : cut).trimEnd()}…`;
}

/** The narrator's cast file, in the project's language (a voice, no rig). */
export function narratorOf(language: Language): Readonly<Record<string, unknown>> {
  const texts = starterTexts(language);
  const voice = { id: NARRATOR_VOICE, style: defaultVoiceStyle(language) };
  return { id: NARRATOR_ID, name: texts.narrator, voice, personality: texts.personality, defaultExpression: 'neutral' };
}

/** The first characters that fit on stage, each on its named position. */
export function stagedCharacters(ids: readonly string[], aspect: AspectRatio): ReadonlyArray<Readonly<{ character: string; position: Named }>> {
  const staged = ids.slice(0, Placement.limitOf(aspect));
  const positions = POSITIONS[staged.length]!;
  return staged.map((character, index) => ({ character, position: positions[index]! }));
}
