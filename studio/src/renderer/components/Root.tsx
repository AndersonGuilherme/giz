import { useMemo, useState } from 'react';
import type { GizApi } from '../../shared/GizApi.ts';
import { translator } from '../../shared/i18n/translate.ts';
import type { Settings } from '../../shared/settings.ts';
import type { Failure } from '../../shared/contract.ts';
import { I18nContext, useTranslate } from '../i18n.ts';
import { SetupContext } from '../state/SetupContext.ts';
import { useAccounts } from '../state/useAccounts.ts';
import { RenderJobContext, useRenderJob } from '../state/useRenderJob.ts';
import { useSettings } from '../state/useSettings.ts';
import { useSetupJobs } from '../state/useSetupJobs.ts';
import { FailurePanel } from './FailurePanel.tsx';
import { SettingsScreen } from './settings/SettingsScreen.tsx';
import { Studio, type View } from './Studio.tsx';
import { FirstRunWizard } from './wizard/FirstRunWizard.tsx';

// The Studio's own screen survives a visit to Settings: closing it goes back where the person was.
function Screen({ api, settings }: Readonly<{ api: GizApi; settings: Settings }>) {
  const [inSettings, setInSettings] = useState(false);
  const [view, setView] = useState<View>({ name: 'home' });
  if (settings.firstRun) return <FirstRunWizard />;
  if (inSettings) return <SettingsScreen onClose={() => setInSettings(false)} />;
  return <Studio api={api} view={view} go={setView} onSettings={() => setInSettings(true)} />;
}

function Loading({ failure }: Readonly<{ failure: Failure | null }>) {
  const translate = useTranslate();
  if (failure) return <main className="board"><FailurePanel failure={failure} /></main>;
  return <p className="hint">{translate('app.loading')}</p>;
}

/** The whole window: the first-run wizard until it is finished, then the Studio, with Settings any time; a render outlives them all. */
export function Root({ api }: Readonly<{ api: GizApi }>) {
  const { settings, failure, ...actions } = useSettings(api);
  const jobs = useSetupJobs(api, settings?.modelsDir, actions.reload);
  const accounts = useAccounts(api);
  const render = useRenderJob(api);
  const language = settings?.language;
  const translate = useMemo(() => translator(language), [language]);
  return (
    <I18nContext.Provider value={translate}>
      <div className="studio" lang={language}>
        {settings && failure && <main className="board"><FailurePanel failure={failure} /></main>}
        {settings ? (
          <SetupContext.Provider value={{ settings, actions, jobs, accounts }}>
            <RenderJobContext.Provider value={render}><Screen api={api} settings={settings} /></RenderJobContext.Provider>
          </SetupContext.Provider>
        ) : <Loading failure={failure} />}
      </div>
    </I18nContext.Provider>
  );
}
