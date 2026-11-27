import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { PANELS, type Panel } from '../setup/panels.ts';
import { Brand } from '../Brand.tsx';
import { StepRail } from './StepRail.tsx';

type FooterProps = Readonly<{ step: number; panel: Panel; go: (step: number) => void }>;

// The way on: an optional step not done yet is only skipped (its own button is the action); otherwise "Continuar".
function Forward({ step, panel, go }: FooterProps) {
  const translate = useTranslate();
  const setup = useSetup();
  const done = panel.done(setup);
  const last = step === PANELS.length - 1;
  if (panel.optional && !done) return <button type="button" className="chalk-button" data-testid="wizard-skip" onClick={() => go(step + 1)}>{translate('app.skip')}</button>;
  const next = () => (last ? setup.actions.finish() : go(step + 1));
  return <button type="button" className="chalk-button primary" data-testid="wizard-next" disabled={!done} onClick={next}>{translate(last ? 'app.finish' : 'app.next')}</button>;
}

function Footer(props: FooterProps) {
  const translate = useTranslate();
  const { step, go } = props;
  return (
    <footer className="wizard-footer">
      {step > 0 ? <button type="button" className="chalk-button quiet" data-testid="wizard-back" onClick={() => go(step - 1)}>{translate('app.back')}</button> : <span />}
      <Forward {...props} />
    </footer>
  );
}

function WizardHeader() {
  const translate = useTranslate();
  return (
    <header className="wizard-header">
      <Brand />
      <h2>{translate('wizard.title')}</h2>
      <p className="muted">{translate('wizard.subtitle')}</p>
    </header>
  );
}

/** The first run: one panel per step, the rail on top, back / skip / continue below. */
export function FirstRunWizard() {
  const translate = useTranslate();
  const [step, go] = useState(0);
  const panel = PANELS[step] ?? PANELS[0];
  const { Component } = panel;
  return (
    <div className="wizard" data-testid={`wizard-${panel.id}`}>
      <WizardHeader />
      <StepRail current={step} />
      <section className="card panel">
        <h2 className="panel-title"><span className="step-number">{step + 1}</span>{translate(panel.title)}</h2>
        <Component />
      </section>
      <Footer step={step} panel={panel} go={go} />
    </div>
  );
}
