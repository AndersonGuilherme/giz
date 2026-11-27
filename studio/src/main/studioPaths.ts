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
