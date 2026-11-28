import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Where the Studio keeps things. Normally: the person's home, Electron's userData and core's gizzycera.config.json at the
 * repository root. `GIZZY_STUDIO_HOME=<folder>` isolates all three inside that folder (the smoke test uses it, so it never
 * touches the real settings); `GIZZY_STUDIO_REHEARSAL=1` swaps the machine tools for pretend ones (no downloads).
 */
export type StudioPaths = Readonly<{
  home: string;
  /** undefined: Electron's own userData. */
  userData?: string;
  /** undefined: core's gizzycera.config.json at the repository root. */
  gizzyConfig?: string;
  rehearsal: boolean;
}>;

export function studioPathsOf(env: Readonly<Record<string, string | undefined>>, home: string): StudioPaths {
  const rehearsal = env.GIZZY_STUDIO_REHEARSAL === '1';
  const isolated = env.GIZZY_STUDIO_HOME?.trim();
  if (!isolated) return { home, rehearsal };
  return { home: isolated, userData: join(isolated, 'userData'), gizzyConfig: join(isolated, 'gizzycera.config.json'), rehearsal };
}

/** ~/Gizzycera/projetos (projects in English): the suggested projects folder, in the interface's language. */
export const defaultProjectsFolderIn = (home: string, language: 'pt-BR' | 'en'): string => join(home, 'Gizzycera', language === 'en' ? 'projects' : 'projetos');
/** ~/.config/gizzycera: the CLI's key files, where keys go without a system keychain. */
export const keyFolderIn = (home: string): string => join(home, '.config', 'gizzycera');

/** The first-run interface language: Portuguese for a Portuguese system, English otherwise. */
export const systemLanguageOf = (locale: string): 'pt-BR' | 'en' => (locale.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en');

type Environment = Readonly<Record<string, string | undefined>>;
/**
 * `packaged`: the installed app (its core folder is read-only); `userData`: Electron's, after preparePaths; `former`:
 * the userData of giz Estúdio (before the rename), when there is one; `exists`: how to look at the disk (tests).
 */
export type RunKind = Readonly<{ packaged: boolean; userData: string; env: Environment; former?: string; exists?: (path: string) => boolean }>;

// A large download in userData (Whisper, the ONNX Runtime copy): the new one, or the old userData's while only that one has it.
function downloadedIn({ userData, former, exists = existsSync }: RunKind, name: string): string {
  const now = join(userData, name);
  const old = former === undefined ? undefined : join(former, name);
  return old !== undefined && !exists(now) && exists(old) ? old : now;
}

/**
 * The variables that tell core (here and in the workers, which inherit them) where its writable files go: the
 * installed app keeps gizzycera.config.json in ~/.config/gizzycera (beside the CLI's keys), Whisper and the ONNX
 * Runtime copy that gets the GPU provider in userData (its own folder is read-only; giz Estúdio's while only that one
 * has them). An isolated home's gizzycera.config.json always wins. A checkout keeps core's own places. Otherwise what
 * is already set is left as it is.
 */
export function coreEnvironmentOf(paths: StudioPaths, run: RunKind): Record<string, string> {
  const { packaged, env } = run;
  const installed = packaged ? { GIZZY_WHISPER_CACHE: downloadedIn(run, 'whisper'), GIZZY_ORT_DIR: downloadedIn(run, 'onnxruntime') } : {};
  const config = packaged ? { GIZZY_CONFIG: join(keyFolderIn(paths.home), 'gizzycera.config.json') } : {};
  const kept = Object.entries({ ...config, ...installed }).filter(([name]) => !env[name]);
  return { ...Object.fromEntries(kept), ...(paths.gizzyConfig ? { GIZZY_CONFIG: paths.gizzyConfig } : {}) };
}

/** The app's own folder in the system's app data folder: an ASCII name (no space or accent in any path). */
const USER_DATA_FOLDER = 'gizzycera';

/** userData: an isolated home's own, or gizzycera in the system's app data folder (`appData`). */
export const userDataIn = (paths: StudioPaths, appData: string): string => paths.userData ?? join(appData, USER_DATA_FOLDER);
