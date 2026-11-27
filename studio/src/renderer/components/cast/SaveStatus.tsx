import type { CharacterProblem } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import type { SaveState } from '../../state/useCharacterDraft.ts';

/** Saved, waiting, or refused by core's check with each problem (field and message): nothing is written then. */
export function SaveStatus({ state, problems }: Readonly<{ state: SaveState; problems: readonly CharacterProblem[] }>) {
  const translate = useTranslate();
  return (
    <div className={`character-status ${state}`} data-testid="character-save" data-state={state} role="status">
      <span>{translate(`cast.save.${state}`)}</span>
      {state === 'problems' && <ul className="problem-list">{problems.map(({ path, message }) => <li key={`${path}:${message}`}><code>{path}</code> {message}</li>)}</ul>}
    </div>
  );
}
