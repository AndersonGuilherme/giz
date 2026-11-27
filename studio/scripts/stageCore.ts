// Stages core for the installed app in out/core-stage/core, which the packaging copies to resources/core (see
// forge.config.mts and config/coreLocation.ts): core's package.json, sources and data folders, its production modules
// (pruned, see stage/pruning.ts), the Remotion compositions bundled now (the app has no webpack) and this machine's
// Chrome Headless Shell (renders work offline from the first run). Run: node scripts/stageCore.ts
import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { leftOut, moduleLeftOut } from './stage/pruning.ts';
import { productionModules } from './stage/productionModules.ts';

const CORE = fileURLToPath(new URL('../../core', import.meta.url));
const LICENSE = fileURLToPath(new URL('../../LICENSE', import.meta.url));
/** Where the staged core is (the packaging's extraResource). */
export const STAGED_CORE = fileURLToPath(new URL('../out/core-stage/core', import.meta.url));
const DATA = ['package.json', 'src', 'public', 'casts', 'presets', 'formats'];
const BROWSERS = join('node_modules', '.remotion');

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

// Remotion downloads the browser into <package>/node_modules/.remotion of the working directory's package.
async function copyBrowser(): Promise<void> {
  const script = "import { ensureBrowser } from '@remotion/renderer'; await ensureBrowser();";
  const done = spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd: CORE, stdio: 'inherit' });
  if (done.status !== 0) throw new Error('Chrome Headless Shell could not be downloaded');
  await cp(join(CORE, BROWSERS), join(STAGED_CORE, BROWSERS), { recursive: true, verbatimSymlinks: true });
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
