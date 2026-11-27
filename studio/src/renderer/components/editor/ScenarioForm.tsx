import { useTranslate } from '../../i18n.ts';
import { Picker } from '../common/Picker.tsx';
import { TextField } from '../common/TextField.tsx';
import { useEditorTools } from './EditorContext.ts';
import type { SceneFormProps } from './sceneForms.tsx';

type OnStage = Readonly<{ character: string; position: unknown }>;
type Json = Readonly<Record<string, unknown>>;

const objectOf = (value: unknown): Json => (typeof value === 'object' && value !== null ? (value as Json) : {});
const onStageOf = (value: unknown): readonly OnStage[] => (Array.isArray(value) ? (value as OnStage[]) : []);

/** Who is on stage: each cast member with a body, on or off, and where they stand. */
function StageFields({ index, scene, change }: SceneFormProps) {
  const translate = useTranslate();
  const { document, vocabulary } = useEditorTools();
  const onStage = onStageOf(scene.characters);
  const placed = (id: string) => onStage.find(({ character }) => character === id);
  const toggle = (id: string) => change({ characters: placed(id) ? onStage.filter(({ character }) => character !== id) : [...onStage, { character: id, position: 'center' }] });
  const move = (id: string, position: string) => change({ characters: onStage.map((spot) => (spot.character === id ? { ...spot, position } : spot)) });
  return (
    <div className="on-stage">
      <span className="field-label">{translate('scene.characters')}</span>
      {document.cast.filter(({ body }) => body).map(({ id, name }) => (
        <div key={id} className="row">
          <label className="check"><input type="checkbox" data-testid={`stage-${index}-${id}`} checked={placed(id) !== undefined} onChange={() => toggle(id)} /> {name}</label>
          {placed(id) && typeof placed(id)?.position === 'string' && <Picker label={translate('scene.position')} value={String(placed(id)?.position)} options={vocabulary.positions} group="position" onChange={(position) => move(id, position ?? 'center')} />}
        </div>
      ))}
    </div>
  );
}

/** A scenario: its background, the characters on stage, the camera and the big text. */
export function ScenarioForm(props: SceneFormProps) {
  const translate = useTranslate();
  const { vocabulary } = useEditorTools();
  const { index, scene, change } = props;
  const background = objectOf(scene.background);
  const camera = objectOf(scene.camera);
  const highlight = objectOf(scene.highlight);
  return (
    <div className="form-grid">
      <Picker label={translate('scene.background')} value={typeof background.vector === 'string' ? background.vector : undefined} options={vocabulary.backgrounds} empty={translate('editor.unset')} onChange={(vector) => change({ background: { ...background, vector } })} testId={`scene-background-${index}`} />
      <Picker label={translate('scene.camera')} value={typeof camera.type === 'string' ? camera.type : undefined} options={vocabulary.cameraMoves} group="camera" empty={translate('scene.cameraNone')} onChange={(type) => change({ camera: type ? { ...camera, type } : undefined })} />
      <StageFields {...props} />
      <TextField label={translate('scene.highlight')} value={typeof highlight.text === 'string' ? highlight.text : ''} onChange={(text) => change({ highlight: text ? { ...highlight, text } : undefined })} hint={translate('scene.highlightHint')} />
    </div>
  );
}
