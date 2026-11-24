// Part of the composition point (see composition.ts): the install configuration, loaded once.
import { homedir } from 'node:os';
import { CONFIG_PATH, ConfigFile } from '../../../infrastructure/config/ConfigFile.ts';
import { defaultConfig, type GizConfig } from '../../../infrastructure/config/GizConfig.ts';

export type { GizConfig } from '../../../infrastructure/config/GizConfig.ts';

// To stderr: the missing configuration does not mix with the command output.
const warn = (message: string) => console.warn(`AVISO: ${message}`);

/** giz.config.json at the repository root, or another path (tests). */
export function configFile(path: string = CONFIG_PATH): ConfigFile {
  return new ConfigFile(path, { env: process.env, home: homedir(), warn });
}

export const defaults = (): GizConfig => defaultConfig(homedir());

let loaded: GizConfig | undefined;

/** The install configuration of this machine (read on first use: commands that make no voice never read it). */
export function installConfig(): GizConfig {
  loaded ??= configFile().load();
  return loaded;
}
