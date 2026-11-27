import { randomUUID } from 'node:crypto';
import { access, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { MediaFiles } from '../../ports/MediaCore.ts';
import { isWithin, reallyWithin } from '../../realPaths.ts';
import { translate } from '../../text.ts';

// A file named by the script (`background.image`) must stay inside its project: neither `../` nor a link leaves it.
function inside(folder: string, file: string): string {
  const path = join(folder, file);
  const plain = resolve(path) !== resolve(folder) && isWithin(resolve(folder), resolve(path));
  if (!plain || !reallyWithin(folder, path)) throw new Error(translate('media.outsideProject', { file }));
  return path;
}

const quietly = <T>(work: () => Promise<T>, fallback: T): Promise<T> => work().catch(() => fallback);

/** The media files of the projects with node's file system; every write goes to a draft file, then is renamed into place. */
export class DiskMediaFiles implements MediaFiles {
  async write(folder: string, file: string, bytes: Uint8Array): Promise<void> {
    const target = inside(folder, file);
    await mkdir(dirname(target), { recursive: true });
    const draft = `${target}.${randomUUID()}.tmp`;
    await writeFile(draft, bytes);
    await rename(draft, target);
  }

  read(folder: string, file: string): Promise<Uint8Array | undefined> {
    return quietly(async () => new Uint8Array(await readFile(inside(folder, file))), undefined);
  }

  exists(folder: string, file: string): Promise<boolean> {
    return quietly(async () => (await access(inside(folder, file)), true), false);
  }

  isFolder(folder: string, file: string): Promise<boolean> {
    return quietly(async () => (await stat(inside(folder, file))).isDirectory(), false);
  }

  modified(folder: string, file: string): Promise<number | undefined> {
    return quietly(async () => {
      const found = await stat(inside(folder, file));
      return found.isFile() ? found.mtimeMs : undefined;
    }, undefined);
  }

  async remove(folder: string, file: string): Promise<void> {
    await rm(inside(folder, file), { force: true });
  }

  async entries(folder: string): Promise<readonly Readonly<{ file: string; modified: number }>[]> {
    const found = await readdir(folder, { withFileTypes: true }).catch(() => []);
    const files = found.filter((entry) => entry.isFile()).map(({ name }) => name);
    return Promise.all(files.map(async (file) => ({ file, modified: (await stat(join(folder, file))).mtimeMs })));
  }
}
