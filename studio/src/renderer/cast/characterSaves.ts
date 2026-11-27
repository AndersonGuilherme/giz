import type { CharacterProblem, CharacterSaved } from '../../shared/cast.ts';
import type { Failure } from '../../shared/contract.ts';
import type { DraftAnswer } from '../editor/draftSaver.ts';

/**
 * `saved`: on disk as shown; `waiting`: a change not saved yet; `problems`: core refused it (nothing written);
 * `failed`: the save did not happen (the disk, the folder), with its message.
 */
export type SaveState = 'saved' | 'waiting' | 'problems' | 'failed';
export type Shown = Readonly<{ state: SaveState; problems: readonly CharacterProblem[]; failure: Failure | null }>;

/** What the save status shows after an answer of the character's saver. */
export function shownAfter(current: Shown, { status, result }: DraftAnswer<CharacterSaved>): Shown {
  if (status === 'pending' || status === 'saving') return { ...current, state: 'waiting' };
  if (!result) return current;
  if (!result.ok) return { state: 'failed', problems: [], failure: result.failure };
  return { state: result.value.saved ? 'saved' : 'problems', problems: result.value.problems, failure: null };
}
