import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { ProjectDisk } from '../ports/ProjectDisk.ts';

const LONGEST = 48;
const FALLBACK = 'projeto';

/** A folder name from a text: lower case, no accents, words joined by "-" ("E se os gatos falassem?" → "e-se-os-gatos-falassem"). */
export function slugOf(text: string): string {
  const plain = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slug = plain.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const cut = slug.slice(0, LONGEST).replace(/-+$/, '');
  return cut || FALLBACK;
}

type Place = Readonly<{ parent: string; name: string }>;

async function firstFree(disk: ProjectDisk, { parent, name }: Place, attempt: number): Promise<string> {
  const folder = join(parent, attempt === 1 ? name : `${name}-${attempt}`);
  if (!(await disk.exists(folder))) return folder;
  return firstFree(disk, { parent, name }, attempt + 1);
}

/** `<parent>/<name>`, or `<name>-2`, `<name>-3`... when that folder already exists: a new project never lands on another. */
export function freeFolder(disk: ProjectDisk, parent: string, name: string): Promise<string> {
  return firstFree(disk, { parent, name }, 1);
}

/** Whether `path` is inside `root` and is not `root` itself. */
export function isStrictlyInside(root: string, path: string): boolean {
  const way = relative(resolve(root), resolve(path));
  return way !== '' && way.split(sep)[0] !== '..' && !isAbsolute(way);
}
