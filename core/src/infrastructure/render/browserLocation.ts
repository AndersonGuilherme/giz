import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The machine the shell runs on (`process.platform`/`process.arch`) and how to tell a file exists (tests replace it). */
export type Machine = Readonly<{ platform: string; arch: string; exists: (path: string) => boolean }>;

// The platform folders of Remotion's browser download (`@remotion/renderer` BrowserFetcher `getPlatform`).
const PLATFORMS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  darwin: { arm64: 'mac-arm64', x64: 'mac-x64' },
  linux: { arm64: 'linux-arm64', x64: 'linux64' },
  win32: { x64: 'win64' },
};

const THIS_MACHINE: Machine = { platform: process.platform, arch: process.arch, exists: existsSync };

/**
 * The Chrome Headless Shell Remotion downloaded into the package (`<package>/node_modules/.remotion`). Remotion looks for
 * it from the working directory, so `gizzy` run from another folder (or from Electron) would download it again there;
 * passing this path as `browserExecutable` avoids that. `undefined` when it is not downloaded yet.
 */
export function headlessShellIn(packageFolder: string, machine: Machine = THIS_MACHINE): string | undefined {
  const platform = PLATFORMS[machine.platform]?.[machine.arch];
  if (!platform) return undefined;
  const folder = join(packageFolder, 'node_modules', '.remotion', 'chrome-headless-shell', platform, `chrome-headless-shell-${platform}`);
  const names = ['headless_shell', platform === 'win64' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell'];
  return names.map((name) => join(folder, name)).find((path) => machine.exists(path));
}
