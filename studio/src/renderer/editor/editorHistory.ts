import type { ScriptJson } from '../../shared/script.ts';

/** The script now, the versions before it (undo) and after it (redo). */
export type History = Readonly<{ past: readonly ScriptJson[]; present: ScriptJson; future: readonly ScriptJson[]; last?: Readonly<{ key: string; at: number }> }>;
/** `key`: what was edited (a line's field); `at`: when, in milliseconds. */
export type EditMark = Readonly<{ key: string; at: number }>;

/** How many steps back undo can go (the brief asks for at least 50). */
export const HISTORY_LIMIT = 100;
// Typing in the same field within this time is one step to undo, not one step per letter.
const TYPING_PAUSE = 1200;

export const historyOf = (script: ScriptJson): History => ({ past: [], present: script, future: [] });

const sameTyping = (last: EditMark | undefined, mark: EditMark | undefined) => last !== undefined && mark !== undefined && last.key === mark.key && mark.at - last.at < TYPING_PAUSE;

/** A new version: one more step to undo (or the same step, while the same field is being typed); redo is gone. */
export function edited(history: History, script: ScriptJson, mark?: EditMark): History {
  if (script === history.present) return history;
  if (sameTyping(history.last, mark)) return { ...history, present: script, future: [], last: mark };
  const past = [...history.past, history.present].slice(-HISTORY_LIMIT);
  return { past, present: script, future: [], last: mark };
}

export function undone(history: History): History {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redone(history: History): History {
  const [next, ...future] = history.future;
  if (!next) return history;
  return { past: [...history.past, history.present], present: next, future };
}
