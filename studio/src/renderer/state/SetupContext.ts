import { createContext, useContext } from 'react';
import type { Settings } from '../../shared/settings.ts';
import type { Accounts } from './useAccounts.ts';
import type { SettingsActions } from './useSettings.ts';
import type { SetupJobs } from './useSetupJobs.ts';

/** What the setup panels share: the settings and their actions, the machine tasks and the AI accounts. */
export type Setup = Readonly<{ settings: Settings; actions: SettingsActions; jobs: SetupJobs; accounts: Accounts }>;

export const SetupContext = createContext<Setup | null>(null);

export function useSetup(): Setup {
  const setup = useContext(SetupContext);
  if (!setup) throw new Error('useSetup outside SetupContext');
  return setup;
}
