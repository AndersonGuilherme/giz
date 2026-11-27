import { existsSync } from 'node:fs';
import { chmod, cp, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

/**
 * Where the Remotion entry point and the package public folder (`sounds/`) are; given by the composition point.
 * `scratch` is where the temporary public folder is made (the system temp folder by default); `browserExecutable` is the
 * Chrome Headless Shell of the package (absent: Remotion finds or downloads it from the working directory). `prebuilt`:
 * a bundle of the compositions made at package time (the installed Studio has no webpack), used instead of bundling.
 */
export type RemotionSources = Readonly<{ entryPoint: string; publicFolder: string; scratch?: string; browserExecutable?: string; prebuilt?: string }>;

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

async function copyFiles(folder: string, files: readonly StagedFile[]): Promise<void> {
  for (const file of files) {
    await mkdir(dirname(join(folder, file.at)), { recursive: true });
    await cp(file.from, join(folder, file.at));
  }
}

async function copyInto(folder: string, sources: RemotionSources, files: readonly StagedFile[]): Promise<void> {
  await cp(sources.publicFolder, folder, { recursive: true });
  await copyFiles(folder, files);
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

/** `<package>/remotion-bundle`, the bundle the Studio's packaging makes, when the package has one (a checkout has none). */
export function prebuiltBundleIn(packageFolder: string, exists: (path: string) => boolean = existsSync): string | undefined {
  const folder = join(packageFolder, 'remotion-bundle');
  return exists(join(folder, 'index.html')) ? folder : undefined;
}

// The copy keeps the modes of an installed (read-only) bundle: its folders are opened for the staged files and the removal.
async function writable(folder: string): Promise<void> {
  await chmod(folder, 0o755);
  const entries = await readdir(folder, { withFileTypes: true });
  await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => writable(join(folder, entry.name))));
}

// A copy of the prebuilt bundle with the staged files in its public folder (where `staticFile` asks for them).
async function withPrebuilt<T>(sources: RemotionSources & { prebuilt: string }, files: readonly StagedFile[], use: (serveUrl: string) => Promise<T>): Promise<T> {
  files.forEach(refuseEscape);
  const folder = await mkdtemp(join(sources.scratch ?? tmpdir(), 'giz-bundle-'));
  try {
    await cp(sources.prebuilt, folder, { recursive: true });
    await writable(folder);
    await copyFiles(join(folder, 'public'), files);
    return await use(folder);
  } finally {
    await removed(folder);
  }
}

/**
 * Bundles the compositions with webpack (`@remotion/bundler`, the same one the CLI uses) serving `files`, runs `use`
 * with the serve URL and removes the temporary folders afterwards, also when the bundle or `use` fails. With a
 * prebuilt bundle, a copy of it serves the files instead (webpack is loaded only to bundle).
 */
export function withBundle<T>(sources: RemotionSources, files: readonly StagedFile[], use: (serveUrl: string) => Promise<T>): Promise<T> {
  const { prebuilt } = sources;
  if (prebuilt) return withPrebuilt({ ...sources, prebuilt }, files, use);
  return withPublicDir(sources, files, async (publicDir) => {
    const { bundle } = await import('@remotion/bundler');
    const serveUrl = await bundle({ entryPoint: sources.entryPoint, publicDir });
    try {
      return await use(serveUrl);
    } finally {
      await removed(serveUrl);
    }
  });
}
