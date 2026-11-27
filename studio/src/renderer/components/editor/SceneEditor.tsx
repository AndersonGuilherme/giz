import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import { labelOf } from '../../labels.ts';
import { defaultSceneType, isScene, sceneTemplate, type SceneJson } from '../../editor/sceneTemplates.ts';
import { Picker } from '../common/Picker.tsx';
import { Segmented } from '../common/Segmented.tsx';
import { JsonSceneEditor } from './JsonSceneEditor.tsx';
import { useLine } from './lineAccess.ts';
import { SCENE_FORMS } from './sceneForms.tsx';

type Mode = 'inherit' | 'new';

function SceneBody({ index, scene }: Readonly<{ index: number; scene: SceneJson }>) {
  const translate = useTranslate();
  const { set, vocabulary, document } = useLine(index);
  const [raw, setRaw] = useState(false);
  const Form = SCENE_FORMS[scene.type];
  const bodies = document.cast.filter(({ body }) => body).map(({ id }) => id);
  return (
    <>
      <div className="row scene-type">
        <Picker label={translate('editor.sceneType')} value={scene.type} options={vocabulary.sceneTypes} group="sceneType" onChange={(type) => set('scene', sceneTemplate(type ?? 'talk', bodies))} testId={`scene-type-${index}`} />
        {Form && <button type="button" className="chalk-button small quiet" data-testid={`scene-raw-${index}`} onClick={() => setRaw(!raw)}>{raw ? translate('editor.sceneForm') : translate('editor.sceneJson')}</button>}
      </div>
      {Form && !raw ? <Form index={index} scene={scene} change={(patch) => set('scene', { ...scene, ...patch })} /> : <JsonSceneEditor index={index} scene={scene} />}
    </>
  );
}

/** The scene this line opens: none (the scene before goes on), or a new one with its form or its JSON. */
export function SceneEditor({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { line, set, document } = useLine(index);
  const scene = isScene(line.scene) ? line.scene : undefined;
  const bodies = document.cast.filter(({ body }) => body).map(({ id }) => id);
  const choose = (mode: Mode) => set('scene', mode === 'inherit' ? undefined : sceneTemplate(defaultSceneType(document.format), bodies));
  return (
    <details className="fold scene" open={scene !== undefined}>
      <summary>{translate('editor.scene')}: <b>{scene ? labelOf(translate, 'sceneType', scene.type) : translate('editor.sceneInherit')}</b></summary>
      <Segmented label={translate('editor.sceneMode')} value={scene ? 'new' : 'inherit'} options={['inherit', 'new'] as const} name={(mode) => translate(mode === 'inherit' ? 'editor.sceneInherit' : 'editor.sceneNew')} onChange={choose} testId={`scene-mode-${index}`} />
      {scene && <SceneBody index={index} scene={scene} />}
    </details>
  );
}
