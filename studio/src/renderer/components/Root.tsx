import { useMemo, useState } from 'react';
import type { GizApi } from '../../shared/GizApi.ts';
import { translator } from '../../shared/i18n/translate.ts';
import type { Settings } from '../../shared/settings.ts';
import type { Failure } from '../../shared/contract.ts';
import { I18nContext, useTranslate } from '../i18n.ts';
import { SetupContext } from '../state/SetupContext.ts';
import { useAccounts } from '../state/useAccounts.ts';
import { useSettings } from '../state/useSettings.ts';
import { useSetupJobs } from '../state/useSetupJobs.ts';
import { App } from './App.tsx';
import { FailurePanel } from './FailurePanel.tsx';
import { SettingsScreen } from './settings/SettingsScreen.tsx';
import { FirstRunWizard } from './wizard/FirstRunWizard.tsx';

function Screen({ api, settings }: Readonly<{ api: GizApi; settings: Settings }>) {
  const [view, setView] = useState<'studio' | 'settings'>('studio');
  if (settings.firstRun) return <FirstRunWizard />;
  if (view === 'settings') return <SettingsScreen onClose={() => setView('studio')} />;
  return <App api={api} onSettings={() => setView('settings')} />;
}

function Loading({ failure }: Readonly<{ failure: Failure | null }>) {
  const translate = useTranslate();
  if (failure) return <main className="board"><FailurePanel failure={failure} /></main>;
  return <p className="hint">{translate('app.loading')}</p>;
}

/** The whole window: the first-run wizard until it is finished, then the Studio, with Settings any time. */
export function Root({ api }: Readonly<{ api: GizApi }>) {
  const { settings, failure, ...actions } = useSettings(api);
  const jobs = useSetupJobs(api, settings?.modelsDir, actions.reload);
  const accounts = useAccounts(api);
  const language = settings?.language;
  const translate = useMemo(() => translator(language), [language]);
  return (
    <I18nContext.Provider value={translate}>
      <div className="studio" lang={language}>
        {settings && failure && <main className="board"><FailurePanel failure={failure} /></main>}
        {settings ? <SetupContext.Provider value={{ settings, actions, jobs, accounts }}><Screen api={api} settings={settings} /></SetupContext.Provider> : <Loading failure={failure} />}
      </div>
    </I18nContext.Provider>
  );
}
