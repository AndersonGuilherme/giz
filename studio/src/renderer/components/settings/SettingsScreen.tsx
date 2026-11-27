import { useState } from 'react';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { forgetShownTours } from '../../state/useTour.ts';
import { Brand } from '../Brand.tsx';
import { PANELS } from '../setup/panels.ts';

// "Mostrar tutoriais de novo": every tour starts by itself again the next time its tab opens.
function TourReset() {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  const [asked, setAsked] = useState(false);
  const reset = () => {
    forgetShownTours();
    actions.resetTours();
    setAsked(true);
  };
  return (
    <div className="tour-reset">
      <button type="button" className="chalk-button small quiet" data-testid="tours-reset" onClick={reset}>{translate('tour.reset')}</button>
      <p className="muted small" data-testid="tours-reset-note" aria-live="polite">{translate(asked && settings.toursSeen.length === 0 ? 'tour.resetDone' : 'tour.resetHint')}</p>
    </div>
  );
}

type NavProps = Readonly<{ current: string; choose: (id: string) => void; onClose: () => void }>;

function SettingsNav({ current, choose, onClose }: NavProps) {
  const translate = useTranslate();
  return (
    <nav className="settings-nav" aria-label={translate('settings.title')}>
      <h2>{translate('settings.title')}</h2>
      {PANELS.map(({ id, title }) => (
        <button key={id} type="button" data-testid={`settings-tab-${id}`} className={id === current ? 'on' : ''} aria-current={id === current ? 'page' : undefined} onClick={() => choose(id)}>{translate(title)}</button>
      ))}
      <TourReset />
      <button type="button" className="chalk-button small back" data-testid="settings-close" onClick={onClose}>← {translate('app.backToStudio')}</button>
    </nav>
  );
}

/** The same panels as the first run, any time: a list on the left, the chosen panel on the right. */
export function SettingsScreen({ onClose }: Readonly<{ onClose: () => void }>) {
  const translate = useTranslate();
  const [current, choose] = useState(PANELS[0]?.id ?? '');
  const panel = PANELS.find(({ id }) => id === current) ?? PANELS[0];
  const { Component } = panel;
  return (
    <>
      <header className="header"><Brand /></header>
      <div className="settings" data-testid={`settings-${panel.id}`}>
        <SettingsNav current={current} choose={choose} onClose={onClose} />
        <section className="card panel">
          <h2 className="panel-title">{translate(panel.title)}</h2>
          <Component />
        </section>
      </div>
    </>
  );
}
