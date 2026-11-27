import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergedConfig, type Environment, type GizConfig } from './GizConfig.ts';

/** giz.config.json at the repository root (the folder above core/), where the motor kept it. */
export const CONFIG_PATH = fileURLToPath(new URL('../../../../giz.config.json', import.meta.url));

/**
 * The file this process uses: GIZ_CONFIG when it names one (the installed Studio, whose package folder is read-only,
 * keeps it in ~/.config/giz), otherwise the repository one.
 */
export const configPath = (env: Environment = process.env): string => env.GIZ_CONFIG?.trim() || CONFIG_PATH;

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
    mkdirSync(dirname(this.#path), { recursive: true });
    writeFileSync(this.#path, `${JSON.stringify(config, null, 2)}\n`);
  }
}
