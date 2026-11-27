import { useTranslate } from '../../i18n.ts';
import { useEditorTools } from './EditorContext.ts';

/** The errors and warnings of this line, right under it. */
export function LineProblems({ index }: Readonly<{ index: number }>) {
  const translate = useTranslate();
  const { errors, warnings } = useEditorTools();
  const mine = [...errors.filter(({ line }) => line === index).map((problem) => ({ ...problem, tone: 'error' })), ...warnings.filter(({ line }) => line === index).map((problem) => ({ ...problem, tone: 'warning' }))];
  if (mine.length === 0) return null;
  return (
    <ul className="line-problems" data-testid={`line-problems-${index}`}>
      {mine.map(({ field, message, tone }, at) => (
        <li key={at} className={tone}><b>{translate(tone === 'error' ? 'editor.error' : 'editor.warning')}</b>{field && <code>{field}</code>} {message}</li>
      ))}
    </ul>
  );
}
