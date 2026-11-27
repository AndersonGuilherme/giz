import type { ComponentType } from 'react';
import type { MessageKey } from '../../../shared/i18n/translate.ts';
import type { Setup } from '../../state/SetupContext.ts';
import { AccountsPanel } from './AccountsPanel.tsx';
import { GpuPanel } from './GpuPanel.tsx';
import { LanguagePanel } from './LanguagePanel.tsx';
import { LicensePanel } from './LicensePanel.tsx';
import { ProjectsFolderPanel } from './ProjectsFolderPanel.tsx';
import { VoiceModelsPanel } from './VoiceModelsPanel.tsx';

/**
 * `done`: whether this step's work is done. A required step (the projects folder) blocks the wizard until then; an
 * optional one (GPU, models, accounts) offers only "Pular por agora" until its own action is done, then "Continuar".
 */
export type Panel = Readonly<{ id: string; title: MessageKey; Component: ComponentType; done: (setup: Setup) => boolean; optional: boolean }>;

const always = () => true;
// The GPU step is done when there is nothing to install, or it is installed.
const gpuDone = ({ jobs }: Setup) => jobs.gpu !== null && (!jobs.gpu.gpu || !jobs.gpu.supported || jobs.gpu.ready);
const modelDone = ({ jobs, settings }: Setup) => jobs.models?.voice[settings.model].ready ?? false;
const accountsDone = ({ accounts }: Setup) => Object.values(accounts.status?.keys ?? {}).some((storage) => storage !== null);

/** The setup panels, in wizard order; the Settings screen shows the same ones. */
export const PANELS: readonly Panel[] = [
  { id: 'language', title: 'panel.language', Component: LanguagePanel, done: always, optional: false },
  { id: 'projects', title: 'panel.projects', Component: ProjectsFolderPanel, done: ({ settings }) => settings.projectsFolder !== null, optional: false },
  { id: 'gpu', title: 'panel.gpu', Component: GpuPanel, done: gpuDone, optional: true },
  { id: 'models', title: 'panel.models', Component: VoiceModelsPanel, done: modelDone, optional: true },
  { id: 'accounts', title: 'panel.accounts', Component: AccountsPanel, done: accountsDone, optional: true },
  { id: 'license', title: 'panel.license', Component: LicensePanel, done: always, optional: false },
];
