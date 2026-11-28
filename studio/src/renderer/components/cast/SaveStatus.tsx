import type { CharacterFile, CharacterProblem, RigInfo } from '../../../shared/cast.ts';
import type { Failure } from '../../../shared/contract.ts';
import { useTranslate } from '../../i18n.ts';
import { problemLine } from '../../cast/problemText.ts';
import type { SaveState } from '../../state/useCharacterDraft.ts';

/** `file` and `rig`: the character as edited, so each problem is said with the field and value the person sees. */
type Props = Readonly<{ state: SaveState; problems: readonly CharacterProblem[]; failure: Failure | null; file: CharacterFile; rig: RigInfo | undefined }>;

/** Saved, waiting, refused by core's check with each problem (field and message), or failed with its message. */
export function SaveStatus({ state, problems, failure, file, rig }: Props) {
  const translate = useTranslate();
  return (
    <div className={`character-status ${state}`} data-testid="character-save" data-state={state} role="status">
      <span>{translate(`cast.save.${state}`)}</span>
      {state === 'failed' && failure && <p className="problem-list" data-testid="character-save-failure">{failure.message}</p>}
      {state === 'problems' && <ul className="problem-list">{problems.map((problem) => ({ problem, line: problemLine(translate, problem, { file, rig }) })).map(({ problem, line }) => <li key={`${problem.path}:${problem.message}`} data-path={problem.path}><strong>{line.field}</strong>: {line.text}</li>)}</ul>}
    </div>
  );
}
