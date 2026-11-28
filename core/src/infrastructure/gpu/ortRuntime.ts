import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { copyFile, mkdir, rename } from 'node:fs/promises';
import { createRequire, registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Where ONNX Runtime's native library is. The CUDA provider must sit next to it (ONNX Runtime looks for it beside its
// own library). In a checkout that is onnxruntime-node's own folder; the installed Studio's is read-only (deb, rpm,
// AppImage), so the Studio names a writable folder (GIZ_ORT_DIR, in its userData): the GPU install copies the library
// and the binding there and puts the provider beside them, and the processes that run the voice load the binding from
// that copy (useWritableOrt), so ONNX Runtime finds the provider.
const require = createRequire(import.meta.url);
const PROVIDERS = /^libonnxruntime_providers_/;
const BINDING = 'onnxruntime_binding.node';
const CUDA_PROVIDER = 'libonnxruntime_providers_cuda.so';

type Environment = Readonly<Record<string, string | undefined>>;

const packageRoot = () => dirname(require.resolve('onnxruntime-node/package.json'));

/** The ONNX Runtime version of core's onnxruntime-node (its CUDA provider must be the same one). */
export const ortVersion = (): string => (JSON.parse(readFileSync(join(packageRoot(), 'package.json'), 'utf8')) as { version: string }).version;

/** onnxruntime-node's own native folder for this machine (bin/napi-v*\/<platform>/<arch>). */
export function ortPackageFolder(): string {
  const base = join(packageRoot(), 'bin');
  const napi = readdirSync(base).find((name) => name.startsWith('napi-')) ?? '';
  return join(base, napi, process.platform, process.arch);
}

/** Where the library the voice loads is: the package's folder, or the writable copy GIZ_ORT_DIR names. */
export function ortRuntimeFolder(env: Environment = process.env): string {
  const writable = env.GIZ_ORT_DIR?.trim();
  if (!writable) return ortPackageFolder();
  return join(writable, ortVersion(), `${process.platform}-${process.arch}`);
}

/** Copies the native library and binding (no provider) from `from` to `to`, each file landing whole. */
export async function copyOrtRuntime(from: string, to: string): Promise<void> {
  await mkdir(to, { recursive: true });
  for (const name of readdirSync(from).filter((file) => !PROVIDERS.test(file))) {
    await copyFile(join(from, name), join(to, `${name}.part`));
    await rename(join(to, `${name}.part`), join(to, name));
  }
}

/**
 * In this process, loads onnxruntime-node's binding from the writable copy when the GPU was installed there (its CUDA
 * provider present). Call it before anything loads onnxruntime-node. Returns whether it did.
 */
export function useWritableOrt(env: Environment = process.env): boolean {
  if (!env.GIZ_ORT_DIR?.trim()) return false;
  const folder = ortRuntimeFolder(env);
  if (!existsSync(join(folder, CUDA_PROVIDER)) || !existsSync(join(folder, BINDING))) return false;
  const copy = pathToFileURL(join(folder, BINDING)).href;
  registerHooks({
    resolve: (specifier, context, nextResolve) => {
      const resolved = nextResolve(specifier, context);
      const isBinding = resolved.url.endsWith(`/${BINDING}`) && resolved.url.includes('/onnxruntime-node/');
      return isBinding ? { ...resolved, url: copy, shortCircuit: true } : resolved;
    },
  });
  return true;
}
