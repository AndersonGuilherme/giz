// Part of the composition point (see composition.ts): the install configuration, loaded once.
import { homedir } from 'node:os';
import { ConfigFile, configPath } from '../../../infrastructure/config/ConfigFile.ts';
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

