import { useTranslate } from '../../i18n.ts';
import { Picker } from '../common/Picker.tsx';
import { useLine } from './lineAccess.ts';

/** The open line's id, who says it and its chapter (its number, drag handle and buttons are on its row). */
export function LineHeader({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { line, script, document, set } = useLine(index);
  const chapters = script.chapters.map((_name, at) => String(at + 1));
  const names = Object.fromEntries(script.chapters.map((name, at) => [String(at + 1), `${at + 1}. ${name}`]));
  const speakers = Object.fromEntries(document.cast.map(({ id, name, body }) => [id, body ? name : `${name} (${translate('editor.voiceOnly')})`]));
  return (
    <div className="line-head">
      <div data-tour="speaker">
        <Picker label={translate('editor.speaker')} value={line.speaker || undefined} options={document.cast.map(({ id }) => id)} names={speakers} onChange={(speaker) => set('speaker', speaker ?? '')} testId={`speaker-${index}`} />
      </div>
      <Picker label={translate('editor.chapter')} value={String(line.chapter)} options={chapters} names={names} onChange={(chapter) => set('chapter', Number(chapter ?? 1))} testId={`chapter-of-${index}`} />
      <span className="line-id muted small">#{line.id}</span>
    </div>
  );
}
