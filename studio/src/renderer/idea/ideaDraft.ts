import type { Aspect } from '../../shared/contract.ts';
import { IDEA_LIMITS, type Format, type IdeaFields, type VideoLanguage } from '../../shared/projects.ts';

/** The wizard's form: the idea fields as typed, the chosen ready characters and scenes. */
export type IdeaDraft = Readonly<{
  format: Format;
  aspect: Aspect;
  targetSeconds: number;
  theme: string;
  audience: string;
  tone: string;
  language: VideoLanguage;
  cast: readonly string[];
  scenes: readonly string[];
}>;

export type DraftField = 'theme' | 'audience' | 'tone' | 'targetSeconds' | 'cast';

/** A lesson has at most two presenters (core refuses more). */
export const LESSON_PRESENTERS = 2;

export const emptyDraft = (language: VideoLanguage): IdeaDraft => ({
  format: 'story', aspect: '9:16', targetSeconds: 60, theme: '', audience: '', tone: '', language, cast: [], scenes: [],
});

/** The id added to the list, or taken out when it is there. */
export const toggled = (list: readonly string[], id: string): readonly string[] => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

const blank = (text: string) => text.trim() === '';
const RULES: Readonly<Record<DraftField, (draft: IdeaDraft) => boolean>> = {
  theme: (draft) => blank(draft.theme) || draft.theme.length > IDEA_LIMITS.theme,
  audience: (draft) => blank(draft.audience) || draft.audience.length > IDEA_LIMITS.short,
  tone: (draft) => blank(draft.tone) || draft.tone.length > IDEA_LIMITS.short,
  targetSeconds: (draft) => !Number.isInteger(draft.targetSeconds) || draft.targetSeconds < IDEA_LIMITS.seconds.min || draft.targetSeconds > IDEA_LIMITS.seconds.max,
  cast: (draft) => draft.format === 'lesson' && draft.cast.length > LESSON_PRESENTERS,
};

/** The fields still missing or out of bounds (the buttons stay off until there are none). */
export function draftProblems(draft: IdeaDraft): readonly DraftField[] {
  return (Object.keys(RULES) as DraftField[]).filter((field) => RULES[field](draft));
}

/** The idea to send: texts trimmed, the empty lists left out (then the AI chooses). */
export function ideaOf(draft: IdeaDraft): IdeaFields {
  const { cast, scenes, theme, audience, tone, ...rest } = draft;
  const lists = { ...(cast.length > 0 ? { cast } : {}), ...(scenes.length > 0 ? { scenes } : {}) };
  return { ...rest, theme: theme.trim(), audience: audience.trim(), tone: tone.trim(), ...lists };
}
