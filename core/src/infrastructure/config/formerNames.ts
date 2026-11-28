import { chmodSync, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
 * The first run after the rename: copies ~/.config/giz to ~/.config/gizzycera (giz.config.json renamed, the keys mode
 * 600, linked keys kept as links) and the repository's giz.config.json to gizzycera.config.json, each only when the
 * new one does not exist yet. Returns what was copied ("old → new").
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

// Copied into a draft beside it and renamed into place: a copy stopped halfway never counts as done.
function copiedFolder(copy: Copy): string | undefined {
  if (!pending(copy) || !lstatSync(copy.former).isDirectory()) return undefined;
  const draft = `${copy.now}.copying-${process.pid}`;
  rmSync(draft, { recursive: true, force: true });
  mkdirSync(dirname(copy.now), { recursive: true });
  cpSync(copy.former, draft, { recursive: true, verbatimSymlinks: true, preserveTimestamps: true });
  renamedConfig(draft);
  chmodSync(draft, 0o700);
  keysOnlyForTheOwner(draft);
  renameSync(draft, copy.now);
  return done(copy);
}

function renamedConfig(folder: string): void {
  if (existsSync(join(folder, FORMER_CONFIG))) renameSync(join(folder, FORMER_CONFIG), join(folder, CONFIG));
}

// A key file (not a link: its target is the person's own file) is readable by its owner only, as the CLI writes it.
function keysOnlyForTheOwner(folder: string): void {
  const keys = readdirSync(folder).filter((name) => name.endsWith('.key') && lstatSync(join(folder, name)).isFile());
  keys.forEach((name) => chmodSync(join(folder, name), 0o600));
}
