// Part of the composition point (see composition.ts): the install configuration, loaded once.
import { homedir } from 'node:os';
import { dirname } from 'node:path';
import { CONFIG_PATH, ConfigFile, configPath } from '../../../infrastructure/config/ConfigFile.ts';
import { formerEnvironment, migrateFormerSetup } from '../../../infrastructure/config/formerNames.ts';
import { defaultConfig, type GizzyConfig } from '../../../infrastructure/config/GizzyConfig.ts';

export type { GizzyConfig } from '../../../infrastructure/config/GizzyConfig.ts';

// To stderr: the missing configuration does not mix with the command output.
const warn = (message: string) => console.warn(`AVISO: ${message}`);

/** gizzycera.config.json at the repository root (or the one GIZZY_CONFIG names), or another path (tests). */
export function configFile(path: string = configPath()): ConfigFile {
  return new ConfigFile(path, { env: process.env, home: homedir(), warn });
}

export const defaults = (): GizzyConfig => defaultConfig(homedir());

let loaded: GizzyConfig | undefined;

/** The install configuration of this machine (read on first use: commands that make no voice never read it). */
export function installConfig(): GizzyConfig {
  loaded ??= configFile().load();
  return loaded;
}

/**
 * At the start of a run, before anything reads them: the GIZ_* variables from before the rename to Gizzycera count as
 * their GIZZY_* names, and the old configuration (~/.config/giz, the repository's giz.config.json) is copied to the new
 * names once. A copy that fails only warns: the defaults still apply.
 */
export function adoptFormerNames(): void {
  Object.assign(process.env, formerEnvironment(process.env));
  try {
    const copied = migrateFormerSetup({ home: homedir(), repository: dirname(CONFIG_PATH) });
    copied.forEach((copy) => console.warn(`configuração de antes do Gizzycera copiada: ${copy}`));
  } catch (error) {
    warn(`a configuração de antes do Gizzycera não pôde ser copiada: ${(error as Error).message}`);
  }
}
