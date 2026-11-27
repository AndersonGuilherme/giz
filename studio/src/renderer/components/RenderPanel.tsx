import type { RenderState } from '../state/studioState.ts';
import { translate } from '../i18n.ts';

type Props = Readonly<{ render: RenderState; blocked: boolean; onRender: () => void; onCancel: () => void }>;

// The line under the bar for each render state: a map, not a chain of ifs.
const STATUS_TEXT: { readonly [Status in RenderState['status']]: (render: Extract<RenderState, { status: Status }>) => string } = {
  idle: () => '',
  running: ({ fraction }) => (fraction === null ? translate('render.preparing') : translate('render.running', { percent: Math.round(fraction * 100) })),
  done: ({ files }) => translate('render.done', { video: files.video }),
  cancelled: () => translate('render.cancelled'),
};

const statusText = (render: RenderState) => (STATUS_TEXT[render.status] as (render: RenderState) => string)(render);
const fractionOf = (render: RenderState) => (render.status === 'running' ? (render.fraction ?? 0) : Number(render.status === 'done'));

export function RenderPanel({ render, blocked, onRender, onCancel }: Props) {
  const running = render.status === 'running';
  return (
    <section className="card render">
      <div className="render-actions">
        <button type="button" className="chalk-button primary" onClick={onRender} disabled={running || blocked}>{translate('render.start')}</button>
        {running && <button type="button" className="chalk-button" onClick={onCancel}>{translate('render.cancel')}</button>}
      </div>
      <progress className="chalk-progress" max={1} value={fractionOf(render)} />
      <p className="status" aria-live="polite">{statusText(render)}</p>
    </section>
  );
}
