import { useEffect, useState } from 'react';
import type { SceneProblem } from '../../../shared/script.ts';
import { useTranslate } from '../../i18n.ts';
import { isScene, type SceneJson } from '../../editor/sceneTemplates.ts';
import { useEditorTools } from './EditorContext.ts';
import { useLine } from './lineAccess.ts';

// How long after the last key the scene is checked by core's schema.
const CHECK_DELAY = 250;

type Parsed = Readonly<{ scene?: SceneJson; error?: string }>;

function parsed(text: string): Parsed {
  try {
    const json: unknown = JSON.parse(text);
    return isScene(json) ? { scene: json } : { error: 'type' };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/** Core's schema problems of the scene, checked a moment after the typing stops. */
function useSceneProblems(scene: SceneJson | undefined): readonly SceneProblem[] {
  const { api } = useEditorTools();
  const [problems, setProblems] = useState<readonly SceneProblem[]>([]);
  useEffect(() => {
    if (!scene) return;
    const timer = setTimeout(() => void api.script.checkScene(scene).then((answer) => answer.ok && setProblems(answer.value)), CHECK_DELAY);
    return () => clearTimeout(timer);
  }, [api, scene]);
  return scene ? problems : [];
}

function SceneProblems({ index, error, problems }: Readonly<{ index: number; error?: string; problems: readonly SceneProblem[] }>) {
  const translate = useTranslate();
  const parseError = error === 'type' ? translate('editor.jsonNeedsType') : translate('editor.jsonInvalid', { message: error ?? '' });
  return (
    <ul className="scene-problems" data-testid={`scene-problems-${index}`} aria-live="polite">
      {error && <li className="error">{parseError}</li>}
      {problems.map(({ path, message }) => <li key={`${path}${message}`} className="error"><code>{path || 'type'}</code> {message}</li>)}
      {!error && problems.length === 0 && <li className="ok">{translate('editor.jsonValid')}</li>}
    </ul>
  );
}

/** The scene as JSON, checked live: invalid JSON is kept here (not saved) until it parses; then it goes to the line. */
export function JsonSceneEditor({ index, scene }: Readonly<{ index: number; scene: SceneJson }>) {
  const { set } = useLine(index);
  const [text, setText] = useState(() => JSON.stringify(scene, null, 2));
  const result = parsed(text);
  const problems = useSceneProblems(result.scene);
  const change = (next: string) => {
    setText(next);
    const { scene: valid } = parsed(next);
    if (valid) set('scene', valid);
  };
  return (
    <div className="json-scene">
      <textarea className={`chalk-input code${result.error || problems.length > 0 ? ' invalid' : ''}`} rows={Math.min(16, text.split('\n').length + 1)} spellCheck={false} value={text} data-testid={`scene-json-${index}`} onChange={(event) => change(event.target.value)} />
      <SceneProblems index={index} error={result.error} problems={problems} />
    </div>
  );
}
