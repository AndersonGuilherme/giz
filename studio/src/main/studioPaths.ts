import { join } from 'node:path';

/**
 * Where the Studio keeps things. Normally: the person's home, Electron's userData and core's giz.config.json at the
 * repository root. `GIZ_STUDIO_HOME=<folder>` isolates all three inside that folder (the smoke test uses it, so it never
 * touches the real settings); `GIZ_STUDIO_REHEARSAL=1` swaps the machine tools for pretend ones (no downloads).
 */
export type StudioPaths = Readonly<{
  home: string;
  /** undefined: Electron's own userData. */
  userData?: string;
  /** undefined: core's giz.config.json at the repository root. */
  gizConfig?: string;
  rehearsal: boolean;
}>;

export function studioPathsOf(env: Readonly<Record<string, string | undefined>>, home: string): StudioPaths {
  const rehearsal = env.GIZ_STUDIO_REHEARSAL === '1';
  const isolated = env.GIZ_STUDIO_HOME?.trim();
  if (!isolated) return { home, rehearsal };
  return { home: isolated, userData: join(isolated, 'userData'), gizConfig: join(isolated, 'giz.config.json'), rehearsal };
}

/** ~/giz/projetos: the suggested projects folder. */
export const defaultProjectsFolderIn = (home: string): string => join(home, 'giz', 'projetos');
/** ~/.config/giz: the CLI's key files, where keys go without a system keychain. */
export const keyFolderIn = (home: string): string => join(home, '.config', 'giz');

/** The first-run interface language: Portuguese for a Portuguese system, English otherwise. */
export const systemLanguageOf = (locale: string): 'pt-BR' | 'en' => (locale.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en');

type Environment = Readonly<Record<string, string | undefined>>;
/** `packaged`: the installed app (its core folder is read-only); `userData`: Electron's, after preparePaths. */
export type RunKind = Readonly<{ packaged: boolean; userData: string; env: Environment }>;

/**
 * The variables that tell core (here and in the workers, which inherit them) where its writable files go: the
 * installed app keeps giz.config.json in ~/.config/giz (beside the CLI's keys), Whisper and the ONNX Runtime copy that
 * gets the GPU provider in userData (its own folder is read-only). An isolated home's giz.config.json always wins. A
 * checkout keeps core's own places. Otherwise what is already set is left as it is.
 */
export function coreEnvironmentOf(paths: StudioPaths, { packaged, userData, env }: RunKind): Record<string, string> {
  const installed = packaged ? { GIZ_WHISPER_CACHE: join(userData, 'whisper'), GIZ_ORT_DIR: join(userData, 'onnxruntime') } : {};
  const config = packaged ? { GIZ_CONFIG: join(keyFolderIn(paths.home), 'giz.config.json') } : {};
  const kept = Object.entries({ ...config, ...installed }).filter(([name]) => !env[name]);
  return { ...Object.fromEntries(kept), ...(paths.gizConfig ? { GIZ_CONFIG: paths.gizConfig } : {}) };
}

/** The app's own folder in the system's app data folder: an ASCII name (no space or accent in any path). */
const USER_DATA_FOLDER = 'giz-estudio';

/** userData: an isolated home's own, or giz-estudio in the system's app data folder (`appData`). */
export const userDataIn = (paths: StudioPaths, appData: string): string => paths.userData ?? join(appData, USER_DATA_FOLDER);
