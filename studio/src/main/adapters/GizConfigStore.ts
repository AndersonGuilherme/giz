import type { SharedConfigStore, SharedSettings } from '../ports/SettingsStores.ts';
import { coreInstall } from './coreModules.ts';

type GizConfig = ReturnType<Awaited<ReturnType<typeof coreInstall>>['defaults']>;

const sharedOf = ({ modelsDir, device, model, remotionLicense }: GizConfig): SharedSettings => ({ modelsDir, device, model, remotionLicense });

/**
 * The repository's giz.config.json through core's own config (the same file and merge rules as `giz setup`): the
 * Studio reads and writes only the keys it shares with the CLI, every other key stays as it was.
 */
export class GizConfigStore implements SharedConfigStore {
  readonly #path: string | undefined;

  /** `path`: another giz.config.json (an isolated Studio home); by default core's, at the repository root. */
  constructor(path?: string) {
    this.#path = path;
  }

  async read(): Promise<SharedSettings> {
    return sharedOf((await this.#file()).load());
  }

  async write(patch: Partial<SharedSettings>): Promise<SharedSettings> {
    const file = await this.#file();
    const config = { ...file.load(), ...patch };
    file.save(config);
    return sharedOf(config);
  }

  async defaults(): Promise<SharedSettings> {
    return sharedOf((await coreInstall()).defaults());
  }

  async #file() {
    const { configFile } = await coreInstall();
    return configFile(this.#path);
  }
}
