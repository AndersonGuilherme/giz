import { cpSync, existsSync, lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Before the rename to Gizzycera the app was "giz Estúdio": its userData was giz-estudio (the first builds used the
// product name, "giz Estúdio"). The person's settings there are copied once into the new folder; nothing is deleted.
const FORMER_FOLDERS = ['giz-estudio', 'giz Estúdio'];

/** The old userData in the system's app data folder, the newer name first; undefined when there is none. */
export function formerUserDataIn(appData: string, exists: (path: string) => boolean = existsSync): string | undefined {
  return FORMER_FOLDERS.map((name) => join(appData, name)).find(exists);
}

// What the person made or chose: the settings, the sealed keys (and on Windows the file that holds their keychain
// key), the projects opened from elsewhere, the portraits and voice samples. Whisper and the ONNX Runtime copy are
// large: core reads them from the old folder instead (see coreEnvironmentOf); Chromium's caches are rebuilt.
const KEPT = ['studio.json', 'keys.json', 'projects.json', 'Local State', 'portraits', 'samples'];

// On Linux the new userData is ~/.config/gizzycera, where the CLI's config and keys live too (core copies ~/.config/giz
// there): the folder may exist already. Each kept entry is copied only where it is missing, and a marker records that
// the copy was made (a file deleted since stays deleted; a copy stopped halfway goes on at the next run).
const COPIED_MARKER = '.copied-from-giz-estudio';

const present = (path: string) => lstatSync(path, { throwIfNoEntry: false }) !== undefined;

/** The first run of Gizzycera: copies what is kept from the old userData into the new one, once. Returns what was copied. */
export function migrateFormerUserData({ former, now }: Readonly<{ former: string | undefined; now: string }>): string[] {
  if (former === undefined || present(join(now, COPIED_MARKER))) return [];
  mkdirSync(now, { recursive: true, mode: 0o700 });
  const missing = KEPT.filter((name) => existsSync(join(former, name)) && !present(join(now, name)));
  missing.forEach((name) => cpSync(join(former, name), join(now, name), { recursive: true, verbatimSymlinks: true, preserveTimestamps: true }));
  writeFileSync(join(now, COPIED_MARKER), `${former}\n`);
  return [`${former} → ${now}`];
}
