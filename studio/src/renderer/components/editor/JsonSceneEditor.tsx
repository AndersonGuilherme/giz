import { useEffect, useRef, useState } from 'react';
import type { SceneProblem } from '../../../shared/script.ts';
import type { Translate } from '../../../shared/i18n/translate.ts';
import { useTranslate } from '../../i18n.ts';
import { parseJson, type JsonProblem } from '../../../shared/jsonText.ts';
import { isScene, type SceneJson } from '../../editor/sceneTemplates.ts';
import { useEditorTools } from './EditorContext.ts';
import { useLine } from './lineAccess.ts';

// How long after the last key the scene is checked by core's schema.
const CHECK_DELAY = 250;

type Parsed = Readonly<{ scene?: SceneJson; problem?: JsonProblem; notScene?: boolean }>;

function parsed(text: string): Parsed {
  const { value, problem } = parseJson(text);
  if (problem) return { problem };
  return isScene(value) ? { scene: value } : { notScene: true };
}

/** "JSON inválido na linha 3, coluna 5": the place from the parser, the words in the interface language. */
export function jsonProblemText(translate: Translate, problem: JsonProblem): string {
  return problem.line === undefined ? translate('editor.jsonInvalid') : translate('editor.jsonInvalidAt', { line: problem.line, column: problem.column ?? 1 });
}

/** Core's schema problems of the scene, checked a moment after the typing stops; an older answer never wins. */
function useSceneProblems(scene: SceneJson | undefined): readonly SceneProblem[] {
  const { api } = useEditorTools();
  const [problems, setProblems] = useState<readonly SceneProblem[]>([]);
  const asked = useRef(0);
  useEffect(() => {
    const number = ++asked.current;
    if (!scene) return;
    const check = () => void api.script.checkScene(scene).then((answer) => number === asked.current && answer.ok && setProblems(answer.value));
    const timer = setTimeout(check, CHECK_DELAY);
    return () => clearTimeout(timer);
  }, [api, scene]);
  return scene ? problems : [];
}

/** A JSON box whose text does not parse holds unsaved text: the save line says so while it lasts. */
export function useDraftMark(key: string, invalid: boolean): void {
  const { markDraft } = useEditorTools();
  useEffect(() => {
    markDraft(key, invalid);
    return () => markDraft(key, false);
  }, [key, invalid, markDraft]);
}

function SceneProblems({ index, result, problems }: Readonly<{ index: number; result: Parsed; problems: readonly SceneProblem[] }>) {
  const translate = useTranslate();
  const parseError = result.problem ? jsonProblemText(translate, result.problem) : translate('editor.jsonNeedsType');
  const broken = result.problem !== undefined || result.notScene === true;
  return (
    <ul className="scene-problems" data-testid={`scene-problems-${index}`} aria-live="polite">
      {broken && <li className="error">{parseError} · {translate('editor.notSaved')}</li>}
      {problems.map(({ path, message }) => <li key={`${path}${message}`} className="error"><code>{path || 'type'}</code> {message}</li>)}
      {!broken && problems.length === 0 && <li className="ok">{translate('editor.jsonValid')}</li>}
    </ul>
  );
}

/** The scene as JSON, checked live: invalid JSON is kept here (not saved) until it parses; then it goes to the line. */
export function JsonSceneEditor({ index, scene }: Readonly<{ index: number; scene: SceneJson }>) {
  const { set } = useLine(index);
  const [text, setText] = useState(() => JSON.stringify(scene, null, 2));
  const result = parsed(text);
  const problems = useSceneProblems(result.scene);
  useDraftMark(`scene-${index}`, !result.scene);
  const change = (next: string) => {
    setText(next);
    const { scene: valid } = parsed(next);
    if (valid) set('scene', valid);
  };
  return (
    <div className="json-scene">
      <textarea className={`chalk-input code${result.scene && problems.length === 0 ? '' : ' invalid'}`} rows={Math.min(16, text.split('\n').length + 1)} spellCheck={false} value={text} data-testid={`scene-json-${index}`} onChange={(event) => change(event.target.value)} />
      <SceneProblems index={index} result={result} problems={problems} />
    </div>
  );
}
