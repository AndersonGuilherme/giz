import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergedConfig, type Environment, type GizConfig } from './GizConfig.ts';

/** giz.config.json at the repository root (the folder above core/), where the motor kept it. */
export const CONFIG_PATH = fileURLToPath(new URL('../../../../giz.config.json', import.meta.url));

/** How to look at this machine (tests replace it). */
export type ConfigPlace = Readonly<{ exists: (path: string) => boolean; home: string }>;
const THIS_MACHINE: ConfigPlace = { exists: existsSync, home: homedir() };

/**
 * The file this process uses: GIZ_CONFIG when it names one (the installed Studio, whose package folder is read-only,
 * keeps it in ~/.config/giz); otherwise the repository one, or, when the repository has none, the installed
 * Studio's, so the CLI and the app share one configuration.
 */
export function configPath(env: Environment = process.env, place: ConfigPlace = THIS_MACHINE): string {
  const named = env.GIZ_CONFIG?.trim();
  return named || localPath(place);
}

function localPath(place: ConfigPlace): string {
  const studio = join(place.home, '.config', 'giz', 'giz.config.json');
  return !place.exists(CONFIG_PATH) && place.exists(studio) ? studio : CONFIG_PATH;
}

type Sources = Readonly<{ env: Environment; home: string; warn: (message: string) => void }>;

function parsed(path: string): Partial<GizConfig> {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Partial<GizConfig>;
  } catch (error) {
    throw new Error(`não foi possível ler ${path}: ${(error as Error).message}`);
  }
}

/** Reads and writes the install configuration; without the file the defaults apply. */
export class ConfigFile {
  readonly #path: string;
  readonly #sources: Sources;

  constructor(path: string, sources: Sources) {
    this.#path = path;
    this.#sources = sources;
  }

  exists(): boolean {
    return existsSync(this.#path);
  }

  load(): GizConfig {
    const { env, home, warn } = this.#sources;
    if (this.exists()) return mergedConfig(parsed(this.#path), { env, home });
    if (!env.GIZ_QUIET) warn('giz.config.json não encontrado; usando os padrões (CPU). Rode `npx giz setup` para configurar.');
    return mergedConfig({}, { env, home });
  }

  save(config: GizConfig): void {
    mkdirSync(dirname(this.#path), { recursive: true, mode: 0o700 });
    writeFileSync(this.#path, `${JSON.stringify(config, null, 2)}\n`);
  }
}
