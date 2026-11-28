import { randomUUID } from 'node:crypto';
import { realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative } from 'node:path';

// A file another program may read while it is written (the Studio, a render, the CLI) is never seen half-written: the
// bytes go to a temp file in the same folder, which is then renamed over the target in one step.
type Data = string | Uint8Array;
const draftOf = (path: string) => join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);

/** Writes `path` whole or not at all (a failure removes the temp file and keeps the old file). */
export async function writeAtomic(path: string, data: Data): Promise<void> {
  const draft = draftOf(path);
  try {
    await writeFile(draft, data);
    await rename(draft, path);
  } catch (error) {
    await rm(draft, { force: true });
    throw error;
  }
}

/** The same, synchronously (the config file). */
export function writeAtomicSync(path: string, data: Data): void {
  const draft = draftOf(path);
  try {
    writeFileSync(draft, data);
    renameSync(draft, path);
  } catch (error) {
    rmSync(draft, { force: true });
    throw error;
  }
}

// The real path a write lands on: the target's own when it exists (a link is followed), else its folder's plus its name.
async function landing(path: string): Promise<string> {
  return realpath(path).catch(async () => join(await realpath(dirname(path)), basename(path)));
}

const inside = (folder: string, path: string) => {
  const way = relative(folder, path);
  return way !== '' && !way.startsWith('..') && !isAbsolute(way);
};

/** Writes `file` (relative to the project `folder`) atomically, refusing a real path outside the folder (a link out). */
export async function writeInside(folder: string, file: string, data: Data): Promise<void> {
  const target = await landing(join(folder, file));
  if (!inside(realpathSync(folder), target)) throw new Error(`${file} leva para fora da pasta do projeto: não foi escrito`);
  await writeAtomic(target, data);
}
