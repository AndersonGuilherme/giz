import { chmodSync, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Environment } from './GizzyConfig.ts';

// Before the rename to Gizzycera the project was "giz": its variables were GIZ_*, its config ~/.config/giz with
// giz.config.json, and the repository kept giz.config.json. People already have those, so the new names fall back to
// them: a variable reads its old name, and the old files are COPIED once (never moved or deleted).

const FORMER_PREFIX = 'GIZ_';
const PREFIX = 'GIZZY_';

/** The GIZ_* variables as GIZZY_* ones, for each GIZZY_* name that is not set (apply it once, at the start). */
export function formerEnvironment(env: Environment): Record<string, string> {
  const former = Object.entries(env).filter(([name, value]) => name.startsWith(FORMER_PREFIX) && name.length > FORMER_PREFIX.length && value !== undefined);
  const renamed = former.map(([name, value]) => [`${PREFIX}${name.slice(FORMER_PREFIX.length)}`, value as string] as const);
  return Object.fromEntries(renamed.filter(([name]) => env[name] === undefined));
}

/** `home`: the person's; `repository`: the folder that holds the repository's config (above core/). */
export type FormerPlaces = Readonly<{ home: string; repository: string }>;

const FORMER_CONFIG = 'giz.config.json';
const CONFIG = 'gizzycera.config.json';

/**
 * The first run after the rename: copies ~/.config/giz into ~/.config/gizzycera (giz.config.json renamed, the keys
 * mode 600, linked keys kept as links), once, and the repository's giz.config.json to gizzycera.config.json when that
 * one does not exist yet. Nothing that already exists is overwritten. Returns what was copied ("old → new").
 */
export function migrateFormerSetup({ home, repository }: FormerPlaces): string[] {
  const folders = { former: join(home, '.config', 'giz'), now: join(home, '.config', 'gizzycera') };
  const files = { former: join(repository, FORMER_CONFIG), now: join(repository, CONFIG) };
  return [copiedFolder(folders), copiedFile(files)].filter((copy): copy is string => copy !== undefined);
}

type Copy = Readonly<{ former: string; now: string }>;
const pending = ({ former, now }: Copy) => existsSync(former) && !existsSync(now);
const done = ({ former, now }: Copy) => `${former} → ${now}`;

function copiedFile(copy: Copy): string | undefined {
  if (!pending(copy) || !lstatSync(copy.former).isFile()) return undefined;
  copyFileSync(copy.former, copy.now);
  return done(copy);
}

// On Linux the Studio's own data folder is ~/.config/gizzycera too, so the folder may exist already: each old entry is
// copied only where the new folder lacks it, and a marker records that the copy was made (a file deleted since stays
// deleted). A copy stopped halfway has no marker yet and goes on at the next run.
const COPIED_MARKER = '.copied-from-giz';

const present = (path: string) => lstatSync(path, { throwIfNoEntry: false }) !== undefined;

function copiedFolder(copy: Copy): string | undefined {
  if (!existsSync(copy.former) || !lstatSync(copy.former).isDirectory() || present(join(copy.now, COPIED_MARKER))) return undefined;
  mkdirSync(copy.now, { recursive: true, mode: 0o700 });
  readdirSync(copy.former).forEach((name) => copiedEntry(copy, name));
  keysOnlyForTheOwner(copy.now);
  writeFileSync(join(copy.now, COPIED_MARKER), `${copy.former}\n`);
  return done(copy);
}

function copiedEntry({ former, now }: Copy, name: string): void {
  const target = join(now, name === FORMER_CONFIG ? CONFIG : name);
  if (present(target)) return;
  cpSync(join(former, name), target, { recursive: true, verbatimSymlinks: true, preserveTimestamps: true });
}

// A key file (not a link: its target is the person's own file) is readable by its owner only, as the CLI writes it.
function keysOnlyForTheOwner(folder: string): void {
  const keys = readdirSync(folder).filter((name) => name.endsWith('.key') && lstatSync(join(folder, name)).isFile());
  keys.forEach((name) => chmodSync(join(folder, name), 0o600));
}
