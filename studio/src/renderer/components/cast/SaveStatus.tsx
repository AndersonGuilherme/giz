import type { CharacterProblem } from '../../../shared/cast.ts';
import type { Failure } from '../../../shared/contract.ts';
import { useTranslate } from '../../i18n.ts';
import type { SaveState } from '../../state/useCharacterDraft.ts';

type Props = Readonly<{ state: SaveState; problems: readonly CharacterProblem[]; failure: Failure | null }>;

/** Saved, waiting, refused by core's check with each problem (field and message), or failed with its message. */
export function SaveStatus({ state, problems, failure }: Props) {
  const translate = useTranslate();
  return (
    <div className={`character-status ${state}`} data-testid="character-save" data-state={state} role="status">
      <span>{translate(`cast.save.${state}`)}</span>
      {state === 'failed' && failure && <p className="problem-list" data-testid="character-save-failure">{failure.message}</p>}
      {state === 'problems' && <ul className="problem-list">{problems.map(({ path, message }) => <li key={`${path}:${message}`}><code>{path}</code> {message}</li>)}</ul>}
    </div>
  );
}
