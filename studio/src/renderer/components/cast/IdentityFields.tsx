import type { CharacterFile } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { Picker } from '../common/Picker.tsx';
import { TextField } from '../common/TextField.tsx';
import type { Gestures } from './LivePreview.tsx';

type Props = Readonly<{ file: CharacterFile; gestures: Gestures; onChange: (file: CharacterFile) => void }>;

/** Who the character is: the name, the personality the text AI reads and the expression it starts lines with. */
export function IdentityFields({ file, gestures, onChange }: Props) {
  const translate = useTranslate();
  return (
    <section className="card form-card">
      <h3>{translate('cast.identity')} <code className="muted small">cast/{file.id}.json</code></h3>
      <div className="form-grid">
        <TextField label={translate('cast.name')} value={file.name} onChange={(name) => onChange({ ...file, name })} testId="character-name" invalid={!file.name.trim()} />
        <Picker label={translate('cast.defaultExpression')} value={file.defaultExpression} options={gestures.expressions} group="expression" onChange={(expression) => expression && onChange({ ...file, defaultExpression: expression })} testId="character-expression" />
      </div>
      <TextField label={translate('cast.personality')} value={file.personality ?? ''} multiline onChange={(personality) => onChange({ ...file, personality })} testId="character-personality" hint={translate('cast.personalityHint')} />
    </section>
  );
}
