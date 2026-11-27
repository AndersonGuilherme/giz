import { useTranslate } from '../../i18n.ts';
import { piecesOf } from '../../editor/textSpans.ts';
import { TextField } from '../common/TextField.tsx';
import { useLine } from './lineAccess.ts';

/** The text with its `[spans]` lit up and numbered: each one fires the beat of the same number. */
function Spans({ text }: Readonly<{ text: string }>) {
  const pieces = piecesOf(text);
  if (!pieces.some(({ span }) => span !== null)) return null;
  return (
    <p className="spans" aria-hidden="true">
      {pieces.map((piece, at) => (piece.span === null ? <span key={at}>{piece.text}</span> : <mark key={at} data-span={piece.span}><sup>{piece.span + 1}</sup>{piece.text}</mark>))}
    </p>
  );
}

/** What the caption shows and, folded, what the voice says when it must differ (an acronym, a foreign word). */
export function LineText({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { line, set, text } = useLine(index);
  const pronunciation = text('pronunciation');
  return (
    <div className="line-text">
      <TextField label={translate('editor.text')} value={line.text ?? ''} multiline onChange={(value) => set('text', value)} testId={`text-${index}`} hint={translate('editor.textHint')} />
      <Spans text={pronunciation ?? line.text ?? ''} />
      <details className="fold" open={pronunciation !== undefined}>
        <summary>{translate('editor.pronunciation')}</summary>
        <TextField label={translate('editor.pronunciationLabel')} value={pronunciation ?? ''} onChange={(value) => set('pronunciation', value || undefined)} testId={`pronunciation-${index}`} />
      </details>
    </div>
  );
}
