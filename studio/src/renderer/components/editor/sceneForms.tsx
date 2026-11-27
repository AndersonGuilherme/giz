import type { FC } from 'react';
import { useTranslate } from '../../i18n.ts';
import { linesText, textLines, type SceneJson } from '../../editor/sceneTemplates.ts';
import { Picker } from '../common/Picker.tsx';
import { TextField } from '../common/TextField.tsx';
import { useEditorTools } from './EditorContext.ts';
import { ScenarioForm } from './ScenarioForm.tsx';

/** A scene type's form: it edits the common fields and hands back the changed ones. */
export type SceneFormProps = Readonly<{ index: number; scene: SceneJson; change: (patch: Readonly<Record<string, unknown>>) => void }>;

const text = (value: unknown) => (typeof value === 'string' ? value : '');

function TitleForm({ scene, change }: SceneFormProps) {
  const translate = useTranslate();
  return (
    <div className="form-row three">
      <TextField label={translate('scene.overline')} value={text(scene.overline)} onChange={(overline) => change({ overline })} />
      <TextField label={translate('scene.title')} value={text(scene.title)} onChange={(title) => change({ title })} />
      <TextField label={translate('scene.subtitle')} value={text(scene.subtitle)} onChange={(subtitle) => change({ subtitle: subtitle || undefined })} />
    </div>
  );
}

function CardForm({ index, scene, change }: SceneFormProps) {
  const translate = useTranslate();
  const { cardVariants } = useVocabulary();
  return (
    <div className="form-grid">
      <Picker label={translate('scene.variant')} value={text(scene.variant)} options={cardVariants} onChange={(variant) => change({ variant })} testId={`scene-variant-${index}`} />
      <TextField label={translate('scene.title')} value={text(scene.title)} onChange={(title) => change({ title })} />
      <TextField label={translate('scene.items')} value={linesText(scene.items)} multiline onChange={(items) => change({ items: textLines(items) })} hint={translate('scene.oneByLine')} />
      <label className="field"><span className="field-label">{translate('scene.shown')}</span><input type="number" min={0} className="chalk-input" value={Number(scene.shown ?? 0)} onChange={(event) => change({ shown: event.target.valueAsNumber || 0 })} /></label>
    </div>
  );
}

function QuoteForm({ scene, change }: SceneFormProps) {
  const translate = useTranslate();
  return <TextField label={translate('scene.quote')} value={text(scene.text)} multiline onChange={(quote) => change({ text: quote })} />;
}

function CodeForm({ scene, change }: SceneFormProps) {
  const translate = useTranslate();
  return (
    <div className="form-grid">
      <TextField label={translate('scene.file')} value={text(scene.title)} onChange={(title) => change({ title })} />
      <TextField label={translate('scene.code')} value={linesText(scene.lines)} multiline onChange={(lines) => change({ lines: textLines(lines) })} hint={translate('scene.codeHint')} />
    </div>
  );
}

function TerminalForm({ scene, change }: SceneFormProps) {
  const translate = useTranslate();
  const outputs = Array.isArray(scene.lines) ? scene.lines.map((line) => text((line as { text?: unknown }).text)) : [];
  return (
    <div className="form-grid">
      <TextField label={translate('scene.command')} value={text(scene.command)} onChange={(command) => change({ command })} />
      <TextField label={translate('scene.output')} value={outputs.join('\n')} multiline onChange={(output) => change({ lines: textLines(output).map((line) => ({ text: line })) })} hint={translate('scene.oneByLine')} />
    </div>
  );
}

function TalkForm() {
  const translate = useTranslate();
  return <p className="muted small">{translate('scene.talk')}</p>;
}

const useVocabulary = () => useEditorTools().vocabulary;

/** The scene types with a form; every other type is edited as JSON. */
export const SCENE_FORMS: Readonly<Partial<Record<string, FC<SceneFormProps>>>> = {
  scenario: ScenarioForm, title: TitleForm, card: CardForm, quote: QuoteForm, code: CodeForm, terminal: TerminalForm, talk: TalkForm,
};
