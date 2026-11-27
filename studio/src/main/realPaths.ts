import { lstatSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

/** Whether `path` is `folder` or inside it (both already absolute and resolved the same way). */
export function isWithin(folder: string, path: string): boolean {
  const way = relative(folder, path);
  return way === '' || (way.split(sep)[0] !== '..' && !isAbsolute(way));
}

const isLink = (path: string) => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};

const realOrUndefined = (path: string) => {
  try {
    return realpathSync.native(path);
  } catch {
    return undefined;
  }
};

/**
 * The path with every link resolved; for a file not written yet, the real path of its nearest existing folder plus the
 * rest. A link that points nowhere is refused (writing through it would land wherever it points).
 */
export function realPathOf(path: string): string {
  const absolute = resolve(path);
  const real = realOrUndefined(absolute);
  if (real !== undefined) return real;
  if (isLink(absolute)) throw new Error(`a link that points nowhere: ${absolute}`);
  const parent = dirname(absolute);
  return parent === absolute ? absolute : join(realPathOf(parent), basename(absolute));
}

/** Whether the real path of `path` is inside the real path of `folder` (a link never leads out); false when unsure. */
export function reallyWithin(folder: string, path: string): boolean {
  try {
    return isWithin(realPathOf(folder), realPathOf(path));
  } catch {
    return false;
  }
}
