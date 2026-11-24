import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { bundle } from '@remotion/bundler';

/** Where the Remotion entry point and the package public folder (`sounds/`) are; given by the composition point. */
export type RemotionSources = Readonly<{ entryPoint: string; publicFolder: string }>;

/** A file to serve: `from` on disk, served at `at` (relative to the public folder, as `staticFile` asks for it). */
export type StagedFile = Readonly<{ from: string; at: string }>;

// The render public folder is a temporary copy: the package sounds plus the project files the video asks for (voices,
// a cast JSON). Copying only those keeps the project folder (with `output/`) out of the bundle.
async function stagePublic(sources: RemotionSources, files: readonly StagedFile[]): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), 'giz-public-'));
  await cp(sources.publicFolder, folder, { recursive: true });
  for (const file of files) {
    await mkdir(dirname(join(folder, file.at)), { recursive: true });
    await cp(file.from, join(folder, file.at));
  }
  return folder;
}

/**
 * Bundles the compositions with webpack (`@remotion/bundler`, the same one the CLI uses) serving `files`, runs `use`
 * with the serve URL and removes the temporary folders afterwards.
 */
export async function withBundle<T>(sources: RemotionSources, files: readonly StagedFile[], use: (serveUrl: string) => Promise<T>): Promise<T> {
  const publicDir = await stagePublic(sources, files);
  const serveUrl = await bundle({ entryPoint: sources.entryPoint, publicDir });
  try {
    return await use(serveUrl);
  } finally {
    await Promise.all([rm(publicDir, { recursive: true, force: true }), rm(serveUrl, { recursive: true, force: true })]);
  }
}
