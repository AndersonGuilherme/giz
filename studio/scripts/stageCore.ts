// Stages core for the installed app in out/core-stage/core, which the packaging copies to resources/core (see
// forge.config.mts and config/coreLocation.ts): core's package.json, sources and data folders, its production modules
// (pruned, see stage/pruning.ts), the Remotion compositions bundled now (the app has no webpack) and the pinned Chrome
// Headless Shell of this platform, checked by its sha256 (renders work offline from the first run; see
// headlessShell.ts). Run: node scripts/stageCore.ts
import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ensureHeadlessShellArchive, HEADLESS_SHELL_VERSION, installHeadlessShell, pinnedShellFor, remotionTestedVersion } from './headlessShell.ts';
import { leftOut, moduleLeftOut } from './stage/pruning.ts';
import { productionModules } from './stage/productionModules.ts';

const CORE = fileURLToPath(new URL('../../core', import.meta.url));
const LICENSE = fileURLToPath(new URL('../../LICENSE', import.meta.url));
/** Where the staged core is (the packaging's extraResource). */
export const STAGED_CORE = fileURLToPath(new URL('../out/core-stage/core', import.meta.url));
const DATA = ['package.json', 'src', 'public', 'casts', 'presets', 'formats'];
const ARCHIVES = fileURLToPath(new URL('../out/headless-shell', import.meta.url));

const posix = (path: string) => path.split(sep).join('/');

async function copyModules(): Promise<void> {
  const modules = productionModules(CORE).filter((module) => !moduleLeftOut(module));
  for (const module of modules) {
    const from = join(CORE, module);
    const filter = (path: string) => !leftOut(posix(module), posix(relative(from, path)));
    await cp(from, join(STAGED_CORE, module), { recursive: true, filter, verbatimSymlinks: true });
  }
}

type Bundler = { bundle: (options: { entryPoint: string; publicDir: string; outDir: string }) => Promise<string> };

async function bundleCompositions(): Promise<void> {
  const bundler = createRequire(join(CORE, 'package.json')).resolve('@remotion/bundler');
  const { bundle } = (await import(pathToFileURL(bundler).href)) as Bundler;
  const outDir = join(STAGED_CORE, 'remotion-bundle');
  // Its source maps stay: the renderer reads bundle.js.map when it serves the bundle (and maps errors with them).
  await bundle({ entryPoint: join(CORE, 'src/presentation/remotion/index.ts'), publicDir: join(CORE, 'public'), outDir });
}

// The pinned archive (kept in out/headless-shell between makes), unpacked where core's headlessShellIn looks for it.
async function copyBrowser(): Promise<void> {
  const tested = remotionTestedVersion(CORE);
  if (tested !== HEADLESS_SHELL_VERSION) throw new Error(`Remotion was tested with Chrome ${tested}, the pin is ${HEADLESS_SHELL_VERSION}: update scripts/headlessShell.ts`);
  const pinned = pinnedShellFor(process.platform, process.arch);
  const archive = await ensureHeadlessShellArchive(join(ARCHIVES, `${pinned.platform}-${HEADLESS_SHELL_VERSION}.zip`), pinned);
  await installHeadlessShell(archive, STAGED_CORE, { core: CORE, platform: pinned.platform });
}

/** Makes out/core-stage/core from scratch. */
export async function stageCore(): Promise<void> {
  await rm(STAGED_CORE, { recursive: true, force: true });
  await mkdir(STAGED_CORE, { recursive: true });
  for (const name of DATA) await cp(join(CORE, name), join(STAGED_CORE, name), { recursive: true });
  await cp(LICENSE, join(STAGED_CORE, 'LICENSE'));
  await copyModules();
  await bundleCompositions();
  await copyBrowser();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await stageCore();
