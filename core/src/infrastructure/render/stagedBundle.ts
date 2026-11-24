import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { bundle } from '@remotion/bundler';

/**
 * Where the Remotion entry point and the package public folder (`sounds/`) are; given by the composition point.
 * `scratch` is where the temporary public folder is made (the system temp folder by default); `browserExecutable` is the
 * Chrome Headless Shell of the package (absent: Remotion finds or downloads it from the working directory).
 */
export type RemotionSources = Readonly<{ entryPoint: string; publicFolder: string; scratch?: string; browserExecutable?: string }>;

/**
 * A file to serve: `from` on disk, served at `at` (relative to the public folder, as `staticFile` asks for it). With
 * `project`, `from` must be inside that folder.
 */
export type StagedFile = Readonly<{ from: string; at: string; project?: string }>;

const removed = (folder: string): Promise<void> => rm(folder, { recursive: true, force: true });

const isInside = (folder: string, path: string): boolean => {
  const way = relative(folder, path);
  return way !== '' && !way.startsWith('..') && !isAbsolute(way);
};

// The safety net under the schema: nothing is copied from outside its project nor to outside the public folder.
function refuseEscape(file: StagedFile): void {
  const publicFolder = resolve('/giz-public');
  if (!isInside(publicFolder, resolve(publicFolder, file.at))) throw new Error(`"${file.at}" sai da pasta pública do render`);
  if (file.project && !isInside(resolve(file.project), resolve(file.from))) throw new Error(`${file.from} está fora da pasta do projeto (${file.project})`);
}

async function copyInto(folder: string, sources: RemotionSources, files: readonly StagedFile[]): Promise<void> {
  await cp(sources.publicFolder, folder, { recursive: true });
  for (const file of files) {
    await mkdir(dirname(join(folder, file.at)), { recursive: true });
    await cp(file.from, join(folder, file.at));
  }
}

/**
 * Runs `use` with a temporary public folder: the package sounds plus the project files the video asks for (voices,
 * scenario images, a cast JSON). Copying only those keeps the project folder (with `output/`) out of the bundle. The
 * folder is removed whatever happens: a missing file while copying, or a failure in `use`.
 */
export async function withPublicDir<T>(sources: RemotionSources, files: readonly StagedFile[], use: (publicDir: string) => Promise<T>): Promise<T> {
  files.forEach(refuseEscape);
  const folder = await mkdtemp(join(sources.scratch ?? tmpdir(), 'giz-public-'));
  try {
    await copyInto(folder, sources, files);
    return await use(folder);
  } finally {
    await removed(folder);
  }
}

/**
 * Bundles the compositions with webpack (`@remotion/bundler`, the same one the CLI uses) serving `files`, runs `use`
 * with the serve URL and removes the temporary folders afterwards, also when the bundle or `use` fails.
 */
export function withBundle<T>(sources: RemotionSources, files: readonly StagedFile[], use: (serveUrl: string) => Promise<T>): Promise<T> {
  return withPublicDir(sources, files, async (publicDir) => {
    const serveUrl = await bundle({ entryPoint: sources.entryPoint, publicDir });
    try {
      return await use(serveUrl);
    } finally {
      await removed(serveUrl);
    }
  });
}
