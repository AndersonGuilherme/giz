import type { InterfaceLanguage } from '../../shared/i18n/translate.ts';
import type { FolderSource, Settings, SettingsPatch } from '../../shared/settings.ts';
import type { FolderPicker } from '../ports/FolderPicker.ts';
import type { AppConfig, AppConfigStore, SharedConfigStore, SharedSettings } from '../ports/SettingsStores.ts';
import type { FolderGrants } from './FolderGrants.ts';

/**
 * `makeFolder` creates a folder (and its parents); `systemLanguage` is the first-run language (from the system's);
 * `onLanguage` switches the main process texts.
 */
type Dependencies = Readonly<{
  app: AppConfigStore;
  shared: SharedConfigStore;
  picker: FolderPicker;
  grants: FolderGrants;
  makeFolder: (folder: string) => Promise<void>;
  defaultProjectsFolder: string;
  systemLanguage: InterfaceLanguage;
  onLanguage: (language: InterfaceLanguage) => void;
}>;

const firstRun = (language: InterfaceLanguage): AppConfig => ({
  language, projectsFolder: null, providers: { text: 'anthropic', image: 'openai', voice: 'qwen' }, firstRunDone: false,
});

const sharedPatchOf = ({ device, model, remotionLicense }: SettingsPatch): Partial<SharedSettings> =>
  Object.fromEntries(Object.entries({ device, model, remotionLicense }).filter(([, value]) => value !== undefined));

/**
 * The first-run and Settings choices. The Studio's own ones go to its userData; the ones the CLI also reads (models
 * folder, device, model, Remotion license) go to giz.config.json through core's config, so both always agree.
 * Folders are chosen only by the default or the system dialog, and the projects folder is granted to the window.
 */
export class SettingsService {
  readonly #dependencies: Dependencies;

  constructor(dependencies: Dependencies) {
    this.#dependencies = dependencies;
  }

  /** At start: the saved language and projects folder take effect. */
  async restore(): Promise<Settings> {
    const app = await this.#app();
    this.#dependencies.onLanguage(app.language);
    if (app.projectsFolder !== null) this.#dependencies.grants.grant(app.projectsFolder);
    return this.get();
  }

  async get(): Promise<Settings> {
    const app = await this.#app();
    const shared = await this.#dependencies.shared.read();
    const { firstRunDone, ...own } = app;
    return { ...own, ...shared, firstRun: !firstRunDone, defaultProjectsFolder: this.#dependencies.defaultProjectsFolder };
  }

  async update(patch: SettingsPatch): Promise<Settings> {
    const app = await this.#app();
    const providers = { ...app.providers, ...patch.providers };
    await this.#saveApp({ ...app, language: patch.language ?? app.language, providers });
    const shared = sharedPatchOf(patch);
    // giz.config.json is written only when one of its own keys changes (the language is the Studio's alone).
    if (Object.keys(shared).length > 0) await this.#dependencies.shared.write(shared);
    if (patch.language) this.#dependencies.onLanguage(patch.language);
    return this.get();
  }

  async projectsFolder(source: FolderSource): Promise<Settings> {
    const { defaultProjectsFolder, grants } = this.#dependencies;
    const folder = source === 'pick' ? await this.#dependencies.picker.pickFolder() : defaultProjectsFolder;
    if (folder === null) return this.get();
    await this.#dependencies.makeFolder(folder);
    await this.#saveApp({ ...(await this.#app()), projectsFolder: grants.grant(folder) });
    return this.get();
  }

  async modelsFolder(source: FolderSource): Promise<Settings> {
    const { shared, picker } = this.#dependencies;
    const folder = source === 'pick' ? await picker.pickFolder() : (await shared.defaults()).modelsDir;
    if (folder === null) return this.get();
    await this.#dependencies.makeFolder(folder);
    await shared.write({ modelsDir: folder });
    return this.get();
  }

  async finish(): Promise<Settings> {
    await this.#saveApp({ ...(await this.#app()), firstRunDone: true });
    return this.get();
  }

  async #app(): Promise<AppConfig> {
    return (await this.#dependencies.app.read()) ?? firstRun(this.#dependencies.systemLanguage);
  }

  #saveApp(config: AppConfig): Promise<void> {
    return this.#dependencies.app.write(config);
  }
}
