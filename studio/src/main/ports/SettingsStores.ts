import type { InterfaceLanguage } from '../../shared/i18n/translate.ts';
import type { Device, ProviderChoices, RemotionLicense, TourId, VoiceModel } from '../../shared/settings.ts';

/** The Studio's own settings, in its userData folder (`studio.json`). */
export type AppConfig = Readonly<{
  language: InterfaceLanguage;
  projectsFolder: string | null;
  providers: ProviderChoices;
  firstRunDone: boolean;
  toursSeen: readonly TourId[];
}>;

export interface AppConfigStore {
  /** null when there is none yet (the first run) or it cannot be read. */
  read(): Promise<AppConfig | null>;
  write(config: AppConfig): Promise<void>;
}

/** The values the Studio shares with the `giz` CLI through the repository's giz.config.json (core's config). */
export type SharedSettings = Readonly<{ modelsDir: string; device: Device; model: VoiceModel; remotionLicense: RemotionLicense }>;

export interface SharedConfigStore {
  read(): Promise<SharedSettings>;
  /** Writes only these keys; every other key of giz.config.json stays as it was. Returns the new values. */
  write(patch: Partial<SharedSettings>): Promise<SharedSettings>;
  /** Core's defaults (the models folder when the person asks for the default one). */
  defaults(): Promise<SharedSettings>;
}
