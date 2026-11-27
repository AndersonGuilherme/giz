import type { Translate } from '../../shared/i18n/translate.ts';
import type { RenderView } from '../state/renderJob.ts';
import { useTranslate } from '../i18n.ts';

type Props = Readonly<{ render: RenderView; blocked: boolean; onRender: () => void; onCancel: () => void }>;

// The line under the bar for each render state: a map, not a chain of ifs.
const STATUS_TEXT: { readonly [Status in RenderView['status']]: (render: Extract<RenderView, { status: Status }>, translate: Translate) => string } = {
  idle: () => '',
  running: ({ fraction }, translate) => (fraction === null ? translate('render.preparing') : translate('render.running', { percent: Math.round(fraction * 100) })),
  done: ({ files }, translate) => translate('render.done', { video: files.video }),
  cancelled: (_render, translate) => translate('render.cancelled'),
};

const statusText = (render: RenderView, translate: Translate) => (STATUS_TEXT[render.status] as (render: RenderView, translate: Translate) => string)(render, translate);
const fractionOf = (render: RenderView) => (render.status === 'running' ? (render.fraction ?? 0) : Number(render.status === 'done'));

/** Render and cancel, the bar (only once a render started) and the line saying how it goes. */
export function RenderPanel({ render, blocked, onRender, onCancel }: Props) {
  const translate = useTranslate();
  const running = render.status === 'running';
  return (
    <section className="card render">
      <div className="render-actions">
        <button type="button" className="chalk-button primary" onClick={onRender} disabled={running || blocked}>{translate('render.start')}</button>
        {running && <button type="button" className="chalk-button" onClick={onCancel}>{translate('render.cancel')}</button>}
      </div>
      {render.status !== 'idle' && <progress className="chalk-progress" max={1} value={fractionOf(render)} />}
      <p className="status" aria-live="polite">{statusText(render, translate)}</p>
    </section>
  );
}
