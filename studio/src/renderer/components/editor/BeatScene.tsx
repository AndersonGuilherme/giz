import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';

type Beat = Readonly<Record<string, unknown>>;
// The speaker's own fields; anything else a beat has changes the current scene (a card reveals an item...).
const OWN = ['expression', 'pose', 'sfx'];

const sceneFieldsOf = (beat: Beat) => Object.fromEntries(Object.entries(beat).filter(([key]) => !OWN.includes(key)));
const ownFieldsOf = (beat: Beat) => Object.fromEntries(Object.entries(beat).filter(([key]) => OWN.includes(key)));

function objectOf(text: string): Beat | undefined {
  try {
    const json: unknown = JSON.parse(text || '{}');
    return typeof json === 'object' && json !== null && !Array.isArray(json) ? (json as Beat) : undefined;
  } catch {
    return undefined;
  }
}

/** What the beat changes in the scene, as JSON (`{"shown": 2}`): kept here until it parses. */
export function BeatScene({ beat, change }: Readonly<{ beat: Beat; change: (beat: Beat) => void }>) {
  const translate = useTranslate();
  const fields = sceneFieldsOf(beat);
  const [text, setText] = useState(Object.keys(fields).length > 0 ? JSON.stringify(fields) : '');
  const valid = objectOf(text) !== undefined;
  const edit = (next: string) => {
    setText(next);
    const parsed = objectOf(next);
    if (parsed) change({ ...ownFieldsOf(beat), ...parsed });
  };
  return (
    <label className="field grow">
      <span className="field-label">{translate('editor.beatScene')}</span>
      <input className={`chalk-input code${valid ? '' : ' invalid'}`} spellCheck={false} placeholder='{"shown": 1}' value={text} onChange={(event) => edit(event.target.value)} />
    </label>
  );
}
