import { statfs } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Free bytes on the disk of `folder`, asked of its nearest existing parent (the models folder may not exist yet). */
export async function freeBytesOf(folder: string): Promise<number | null> {
  const stats = await statfs(folder).catch(() => undefined);
  if (stats) return stats.bavail * stats.bsize;
  const parent = dirname(folder);
  return parent === folder ? null : freeBytesOf(parent);
}
