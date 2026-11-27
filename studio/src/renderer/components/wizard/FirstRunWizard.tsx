import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { PANELS, type Panel } from '../setup/panels.ts';
import { Brand } from '../Brand.tsx';
import { StepRail } from './StepRail.tsx';

type FooterProps = Readonly<{ step: number; panel: Panel; go: (step: number) => void }>;

function Footer({ step, panel, go }: FooterProps) {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  const last = step === PANELS.length - 1;
  const next = () => (last ? actions.finish() : go(step + 1));
  return (
    <footer className="wizard-footer">
      {step > 0 ? <button type="button" className="chalk-button quiet" data-testid="wizard-back" onClick={() => go(step - 1)}>{translate('app.back')}</button> : <span />}
      <div className="row">
        {panel.optional && <button type="button" className="chalk-button quiet" data-testid="wizard-skip" onClick={() => go(step + 1)}>{translate('app.skip')}</button>}
        <button type="button" className="chalk-button primary" data-testid="wizard-next" disabled={!panel.ready(settings)} onClick={next}>{translate(last ? 'app.finish' : 'app.next')}</button>
      </div>
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
