import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import type { MediaFiles } from '../../ports/MediaCore.ts';
import { translate } from '../../text.ts';

// A file named by the script (`background.image`) must stay inside its project: `../` never leaves it.
function inside(folder: string, file: string): string {
  const path = join(folder, file);
  const way = relative(folder, path);
  if (way === '' || way.split(sep)[0] === '..' || isAbsolute(way)) throw new Error(translate('media.outsideProject', { file }));
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

  modified(folder: string, file: string): Promise<number | undefined> {
    return quietly(async () => {
      const found = await stat(inside(folder, file));
      return found.isFile() ? found.mtimeMs : undefined;
    }, undefined);
  }

  async remove(folder: string, file: string): Promise<void> {
    await rm(inside(folder, file), { force: true });
  }
}
