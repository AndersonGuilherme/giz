import { useTranslate } from '../../i18n.ts';
import { Picker } from '../common/Picker.tsx';
import { useLine } from './lineAccess.ts';

/** How the speaker says it: the pose (its strong gesture happens once), the expression and where they look. */
export function GestureFields({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { vocabulary, set, text } = useLine(index);
  const unset = translate('editor.unset');
  return (
    <div className="form-row three">
      <Picker label={translate('editor.pose')} value={text('pose')} options={vocabulary.poses} group="pose" empty={unset} onChange={(value) => set('pose', value)} testId={`pose-${index}`} />
      <Picker label={translate('editor.expression')} value={text('expression')} options={vocabulary.expressions} group="expression" empty={unset} onChange={(value) => set('expression', value)} testId={`expression-${index}`} />
      <Picker label={translate('editor.look')} value={text('look')} options={vocabulary.looks} group="look" empty={unset} onChange={(value) => set('look', value)} testId={`look-${index}`} />
    </div>
  );
}
