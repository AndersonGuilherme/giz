// The settings the first-run wizard and the Settings screen edit. Plain types and constants (shared by all three).
import type { InterfaceLanguage } from './i18n/translate.ts';

export const INTERFACE_LANGUAGES = ['pt-BR', 'en'] as const satisfies readonly InterfaceLanguage[];
export const VOICE_MODELS = ['0.6b', '1.7b'] as const;
export type VoiceModel = (typeof VOICE_MODELS)[number];
export const DEVICES = ['cpu', 'cuda'] as const;
export type Device = (typeof DEVICES)[number];
/** Who uses giz (core's `remotionLicense`): Remotion is free for individuals and companies of up to 3 people. */
export const REMOTION_LICENSES = ['pessoa-fisica', 'empresa-ate-3', 'empresa-com-licenca', 'nao-informado'] as const;
export type RemotionLicense = (typeof REMOTION_LICENSES)[number];

/** The service the person picked for each task (spec 5.6): text writes scripts, image paints scenarios, voice speaks. */
export const TEXT_PROVIDERS = ['anthropic', 'openai', 'gemini'] as const;
export const IMAGE_PROVIDERS = ['openai', 'gemini', 'fal'] as const;
export const VOICE_PROVIDERS = ['qwen', 'elevenlabs', 'fish'] as const;
/** The guided tours of the screens (the Script tab has one): each is shown by itself only the first time. */
export const TOURS = ['script'] as const;
export type TourId = (typeof TOURS)[number];

export type ProviderChoices = Readonly<{
  text: (typeof TEXT_PROVIDERS)[number];
  image: (typeof IMAGE_PROVIDERS)[number];
  voice: (typeof VOICE_PROVIDERS)[number];
}>;

/**
 * Everything the screens show. The Studio's own choices live in its userData (`studio.json`); `modelsDir`, `device`,
 * `model` and `remotionLicense` live in the repository's giz.config.json, shared with the `giz` CLI.
 */
export type Settings = Readonly<{
  /** True until the person finishes the first-run wizard. */
  firstRun: boolean;
  language: InterfaceLanguage;
  projectsFolder: string | null;
  defaultProjectsFolder: string;
  providers: ProviderChoices;
  modelsDir: string;
  device: Device;
  model: VoiceModel;
  remotionLicense: RemotionLicense;
  /** The tours already seen (finished or skipped); Settings can forget them all. */
  toursSeen: readonly TourId[];
}>;

/** What `settings.update` may change; folders change only through `settings.projectsFolder` / `settings.modelsFolder`. */
export type SettingsPatch = Readonly<{
  language?: InterfaceLanguage;
  providers?: Partial<ProviderChoices>;
  device?: Device;
  model?: VoiceModel;
  remotionLicense?: RemotionLicense;
}>;

/** `default`: the suggested folder; `pick`: the system dialog (the window never names a folder itself). */
export type FolderSource = 'default' | 'pick';
