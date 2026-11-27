import type { RenderRecord } from '../../../shared/video.ts';
import { useTranslate } from '../../i18n.ts';
import { lengthText } from '../../video/playhead.ts';

const fileName = (path: string) => path.split(/[\\/]/).at(-1) ?? path;

/** The last renders of the project: when, in which aspect, how long and which file (newest first). */
export function RenderHistory({ renders }: Readonly<{ renders: readonly RenderRecord[] }>) {
  const translate = useTranslate();
  if (renders.length === 0) return <p className="muted small" data-testid="render-history">{translate('video.noRenders')}</p>;
  const when = new Intl.DateTimeFormat(translate('video.locale'), { dateStyle: 'short', timeStyle: 'short' });
  return (
    <div className="render-history" data-testid="render-history">
      <h3>{translate('video.history')}</h3>
      <ol>
        {renders.map((record) => (
          <li key={`${record.at}-${record.aspect}`}>
            <span className="when">{when.format(new Date(record.at))}</span>
            <span className="badge">{record.aspect}</span>
            <span className="length">{lengthText(record.seconds)}</span>
            <code title={record.video}>{fileName(record.video)}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}
