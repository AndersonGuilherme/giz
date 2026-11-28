import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
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

/**
 * The first run of Gizzycera: copies what is kept from the old userData into the new one, only when the new one
 * does not exist yet (through a draft folder, so a copy stopped halfway never counts). Returns what was copied.
 */
export function migrateFormerUserData({ former, now }: Readonly<{ former: string | undefined; now: string }>): string[] {
  if (former === undefined || existsSync(now)) return [];
  const draft = `${now}.copying-${process.pid}`;
  rmSync(draft, { recursive: true, force: true });
  mkdirSync(draft, { recursive: true, mode: 0o700 });
  KEPT.filter((name) => existsSync(join(former, name))).forEach((name) => {
    cpSync(join(former, name), join(draft, name), { recursive: true, verbatimSymlinks: true, preserveTimestamps: true });
  });
  renameSync(draft, now);
  return [`${former} → ${now}`];
}
