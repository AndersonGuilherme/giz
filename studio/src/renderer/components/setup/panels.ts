import type { ComponentType } from 'react';
import type { MessageKey } from '../../../shared/i18n/translate.ts';
import type { Settings } from '../../../shared/settings.ts';
import { AccountsPanel } from './AccountsPanel.tsx';
import { GpuPanel } from './GpuPanel.tsx';
import { LanguagePanel } from './LanguagePanel.tsx';
import { LicensePanel } from './LicensePanel.tsx';
import { ProjectsFolderPanel } from './ProjectsFolderPanel.tsx';
import { VoiceModelsPanel } from './VoiceModelsPanel.tsx';

/** `ready`: whether the wizard may go on from this step (only the projects folder is required). */
export type Panel = Readonly<{ id: string; title: MessageKey; Component: ComponentType; ready: (settings: Settings) => boolean; optional: boolean }>;

const always = () => true;

/** The setup panels, in wizard order; the Settings screen shows the same ones. */
export const PANELS: readonly Panel[] = [
  { id: 'language', title: 'panel.language', Component: LanguagePanel, ready: always, optional: false },
  { id: 'projects', title: 'panel.projects', Component: ProjectsFolderPanel, ready: (settings) => settings.projectsFolder !== null, optional: false },
  { id: 'gpu', title: 'panel.gpu', Component: GpuPanel, ready: always, optional: true },
  { id: 'models', title: 'panel.models', Component: VoiceModelsPanel, ready: always, optional: true },
  { id: 'accounts', title: 'panel.accounts', Component: AccountsPanel, ready: always, optional: true },
  { id: 'license', title: 'panel.license', Component: LicensePanel, ready: always, optional: false },
];
