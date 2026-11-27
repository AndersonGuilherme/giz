import { forwardRef, useId, type CSSProperties } from 'react';
import { useTranslate } from '../../i18n.ts';
import type { TourControl } from '../../state/useTour.ts';
import { Logo } from '../Logo.tsx';

type Props = Readonly<{ control: TourControl; pointing: boolean; style: CSSProperties; side: string }>;

function Dots({ step, steps }: Readonly<{ step: number; steps: number }>) {
  return <span className="tour-dots" aria-hidden="true">{Array.from({ length: steps }, (_none, at) => <i key={at} className={at === step ? 'on' : at < step ? 'past' : ''} />)}</span>;
}

function Buttons({ control }: Readonly<{ control: TourControl }>) {
  const translate = useTranslate();
  const { state, dispatch } = control;
  const last = state.step === state.steps - 1;
  return (
    <footer className="tour-buttons">
      <button type="button" className="chalk-button small quiet" data-testid="tour-skip" onClick={() => dispatch({ type: 'skip' })}>{translate('tour.skip')}</button>
      <span className="row">
        <button type="button" className="chalk-button small" data-testid="tour-back" disabled={state.step === 0} onClick={() => dispatch({ type: 'back' })}>{translate('tour.back')}</button>
        <button type="button" className="chalk-button small primary" data-testid="tour-next" data-primary onClick={() => dispatch({ type: 'next' })}>{translate(last ? 'tour.finish' : 'tour.next')}</button>
      </span>
    </footer>
  );
}

/** The chalk card of a step: the mascot, the count, the title and text, and the buttons to go on, back or skip. */
export const TourCard = forwardRef<HTMLElement, Props>(function TourCard({ control, pointing, style, side }, ref) {
  const translate = useTranslate();
  const ids = useId();
  const { tour, state } = control;
  const step = tour.steps[state.step]!;
  return (
    <section ref={ref} className={`tour-card side-${side}`} style={style} role="dialog" aria-modal="true" aria-label={translate('tour.dialog')} aria-labelledby={`${ids}t`} aria-describedby={`${ids}d`} data-testid="tour" data-step={step.id} data-centred={!pointing}>
      <header className="tour-top"><Logo /><span className="tour-count" data-testid="tour-count">{translate('tour.counter', { step: state.step + 1, total: state.steps })}</span></header>
      <h2 id={`${ids}t`}>{translate(step.title)}</h2>
      <p id={`${ids}d`}>{translate(step.text)}</p>
      {!pointing && step.absent && <p className="tour-absent">{translate(step.absent)}</p>}
      <Dots step={state.step} steps={state.steps} />
      <Buttons control={control} />
    </section>
  );
});
