import { readdir, stat, statfs } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** Free bytes on the disk of `folder`, asked of its nearest existing parent (the models folder may not exist yet). */
export async function freeBytesOf(folder: string): Promise<number | null> {
  const stats = await statfs(folder).catch(() => undefined);
  if (stats) return stats.bavail * stats.bsize;
  const parent = dirname(folder);
  return parent === folder ? null : freeBytesOf(parent);
}

/** The bytes of every file under `folder` (0 when it does not exist): what a stopped download already has. */
export async function bytesIn(folder: string): Promise<number> {
  const names = await readdir(folder, { recursive: true }).catch(() => [] as string[]);
  const sizes = await Promise.all(names.map((name) => stat(join(folder, name)).then((entry) => (entry.isFile() ? entry.size : 0), () => 0)));
  return sizes.reduce((sum, size) => sum + size, 0);
}
