import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import { parseJson } from '../../../shared/jsonText.ts';
import { useDraftMark } from './JsonSceneEditor.tsx';

type Beat = Readonly<Record<string, unknown>>;
// The speaker's own fields; anything else a beat has changes the current scene (a card reveals an item...).
const OWN = ['expression', 'pose', 'sfx'];

const sceneFieldsOf = (beat: Beat) => Object.fromEntries(Object.entries(beat).filter(([key]) => !OWN.includes(key)));
const ownFieldsOf = (beat: Beat) => Object.fromEntries(Object.entries(beat).filter(([key]) => OWN.includes(key)));

function objectOf(text: string): Beat | undefined {
  const { value } = parseJson(text || '{}');
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Beat) : undefined;
}

/** What the beat changes in the scene, as JSON (`{"shown": 2}`): kept here until it parses. */
export function BeatScene({ beat, change, draftKey }: Readonly<{ beat: Beat; change: (beat: Beat) => void; draftKey: string }>) {
  const translate = useTranslate();
  const fields = sceneFieldsOf(beat);
  const [text, setText] = useState(Object.keys(fields).length > 0 ? JSON.stringify(fields) : '');
  const valid = objectOf(text) !== undefined;
  useDraftMark(draftKey, !valid);
  const edit = (next: string) => {
    setText(next);
    const parsed = objectOf(next);
    if (parsed) change({ ...ownFieldsOf(beat), ...parsed });
  };
  return (
    <label className="field grow">
      <span className="field-label">{translate('editor.beatScene')}{!valid && ` · ${translate('editor.notSaved')}`}</span>
      <input className={`chalk-input code${valid ? '' : ' invalid'}`} spellCheck={false} placeholder='{"shown": 1}' value={text} onChange={(event) => edit(event.target.value)} />
    </label>
  );
}
