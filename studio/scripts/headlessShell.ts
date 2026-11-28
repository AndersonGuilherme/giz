// Chrome Headless Shell for the installed app, from a pinned archive checked by its sha256 (like the AppImage
// runtime): the build no longer lets Remotion fetch whatever its download host serves. The archives are the ones
// Remotion 4.0.545 itself picks (remotion.media's builds of its TESTED_VERSION, with its shared-memory patch); the
// staging stops when an upgraded Remotion was tested with another version, so the pins are updated with it.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export const HEADLESS_SHELL_VERSION = '158.0.8127.2';
export type PinnedShell = Readonly<{ url: string; sha256: string }>;
const archive = (name: string) => `https://remotion.media/chromium-headless-shell-${name}-${HEADLESS_SHELL_VERSION}.zip?clear`;

/** By Remotion's platform name (its browser folder): the platforms the release workflow builds on. */
export const HEADLESS_SHELLS: Readonly<Record<'linux64' | 'win64' | 'mac-arm64', PinnedShell>> = {
  linux64: { url: archive('linux-x64'), sha256: '37efc23c796de6a7ae6360b545434863e1c35d9cabc7fddc8036e8c6e00697e8' },
  win64: { url: archive('win-x64'), sha256: '58afb19b136b32c36a9b879cedde3d8a05d0f5cfb2e60b6f17b7c0301e10299a' },
  'mac-arm64': { url: archive('mac-arm64'), sha256: '8b7c8d0c0a04a7d32ade612b51ac9ae1aa7d674d9eb0bb6f794eee253b835a04' },
};
const PLATFORMS: Readonly<Record<string, keyof typeof HEADLESS_SHELLS>> = { 'linux-x64': 'linux64', 'win32-x64': 'win64', 'darwin-arm64': 'mac-arm64' };

/** The pinned shell of this build machine, with Remotion's platform name; throws for a platform without a pin. */
export function pinnedShellFor(platform: string, arch: string): PinnedShell & Readonly<{ platform: string }> {
  const name = PLATFORMS[`${platform}-${arch}`];
  if (!name) throw new Error(`no pinned Chrome Headless Shell for ${platform}-${arch}: add one to scripts/headlessShell.ts`);
  return { ...HEADLESS_SHELLS[name], platform: name };
}

// The renderer's own file (its package exports do not list it): the version its browser download was tested with.
const rendererFile = (core: string, file: string) => join(dirname(createRequire(join(core, 'package.json')).resolve('@remotion/renderer')), file);

/** The Chrome version the installed Remotion was tested with. */
export function remotionTestedVersion(core: string): string {
  return (createRequire(import.meta.url)(rendererFile(core, 'browser/get-chrome-download-url.js')) as { TESTED_VERSION: string }).TESTED_VERSION;
}

const sha256Of = (data: Buffer) => createHash('sha256').update(data).digest('hex');

/** `path` holds the pinned archive (downloaded unless it is already there and whole); returns `path`. */
export async function ensureHeadlessShellArchive(path: string, pinned: PinnedShell, send: typeof fetch = fetch): Promise<string> {
  if (existsSync(path) && sha256Of(await readFile(path)) === pinned.sha256) return path;
  const answer = await send(pinned.url);
  if (!answer.ok) throw new Error(`Chrome Headless Shell: HTTP ${answer.status} for ${pinned.url}`);
  const data = Buffer.from(await answer.arrayBuffer());
  if (sha256Of(data) !== pinned.sha256) throw new Error(`Chrome Headless Shell: the sha256 of ${pinned.url} is not the pinned one`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  return path;
}

type Extract = (archivePath: string, dir: string) => Promise<void>;

/**
 * Unpacks the checked archive where Remotion keeps its download (`<core>/node_modules/.remotion/chrome-headless-shell/
 * <platform>`), with Remotion's own unzip (it keeps the file modes) and the VERSION it writes; the app passes the
 * executable to Remotion (core's headlessShellIn), so nothing is downloaded at run time.
 */
export async function installHeadlessShell(archivePath: string, stagedCore: string, renderer: Readonly<{ core: string; platform: string }>): Promise<void> {
  const folder = join(stagedCore, 'node_modules', '.remotion', 'chrome-headless-shell');
  await rm(folder, { recursive: true, force: true });
  const { extractZipArchive } = createRequire(import.meta.url)(rendererFile(renderer.core, 'browser/extract-zip-archive.js')) as { extractZipArchive: Extract };
  await extractZipArchive(archivePath, join(folder, renderer.platform));
  await writeFile(join(folder, 'VERSION'), `${HEADLESS_SHELL_VERSION}-remotion-v3`);
  const executable = join(folder, renderer.platform, `chrome-headless-shell-${renderer.platform}`, renderer.platform === 'win64' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell');
  if (!existsSync(executable)) throw new Error(`Chrome Headless Shell: ${executable} is not in the pinned archive`);
  if (process.platform !== 'win32') await chmod(executable, 0o755);
}
