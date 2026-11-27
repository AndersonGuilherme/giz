import { randomUUID } from 'node:crypto';
import { access, cp, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { basename, join, relative, sep } from 'node:path';
import type { ProjectDisk } from '../ports/ProjectDisk.ts';
import { translate } from '../text.ts';

// What tells when a project last changed: its own files and its cast (not the voices or video made from them).
const OWN_FOLDERS = ['cast'];
const mtimeOf = (path: string) => stat(path).then(({ mtimeMs }) => mtimeMs, () => 0);

async function filesIn(folder: string): Promise<readonly string[]> {
  const entries = await readdir(folder, { withFileTypes: true }).catch(() => []);
  return entries.filter((entry) => entry.isFile() && !entry.name.startsWith('.')).map((entry) => join(folder, entry.name));
}

/** The project folders with node's file system. */
export class DiskProjects implements ProjectDisk {
  async folders(parent: string): Promise<readonly string[]> {
    const entries = await readdir(parent, { withFileTypes: true }).catch(() => []);
    return entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => join(parent, entry.name));
  }

  exists(path: string): Promise<boolean> {
    return access(path).then(() => true, () => false);
  }

  async readJson(folder: string, file: string): Promise<unknown> {
    const text = await readFile(join(folder, file), 'utf8').catch(() => undefined);
    if (text === undefined) throw new Error(translate('errors.fileMissing', { file }));
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(translate('errors.fileNotJson', { file }));
    }
  }

  async writeJson(folder: string, file: string, json: unknown): Promise<void> {
    const target = join(folder, file);
    const draft = `${target}.${randomUUID()}.tmp`;
    await writeFile(draft, `${JSON.stringify(json, null, 2)}\n`);
    await rename(draft, target);
  }

  async modified(folder: string): Promise<number> {
    const files = [...(await filesIn(folder)), ...(await Promise.all(OWN_FOLDERS.map((name) => filesIn(join(folder, name))))).flat()];
    const times = await Promise.all(files.map(mtimeOf));
    return Math.max(await mtimeOf(folder), ...times);
  }

  async copy(from: string, to: string, skip: readonly string[]): Promise<void> {
    const skipped = (path: string) => skip.includes(relative(from, path).split(sep)[0] ?? '');
    await cp(from, to, { recursive: true, errorOnExist: true, force: false, filter: (path) => !skipped(path) });
  }
}

/** The name a moved folder keeps in the rehearsal trash. */
export const trashedName = (folder: string): string => `${basename(folder)}-${Date.now()}`;
