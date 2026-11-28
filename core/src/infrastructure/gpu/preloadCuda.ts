import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cudaLibraryFolder } from './cudaLibraries.ts';
import { requiredCudaMajor } from './onnxRuntimeCuda.ts';

// The CUDA provider looks the libraries up by name (libcublas.so.13...) only in the system folders. Loading them
// first, by full path, makes the system reuse them. In this order; cuDNN's main library before its parts.
const PRELOAD = [/^libcudart\.so\.\d+$/, /^libcublasLt\.so\.\d+$/, /^libcublas\.so\.\d+$/, /^libcurand\.so\.\d+$/, /^libcudnn.*\.so\.\d+$/];
// RTLD_NOW | RTLD_GLOBAL | RTLD_NODELETE (keeps them loaded).
const DLOPEN_FLAGS = 0x2 | 0x100 | 0x1000;

const cudnnFirst = (first: string, second: string) => Number(second.startsWith('libcudnn.so')) - Number(first.startsWith('libcudnn.so'));

/** The libraries of the folder to preload, in load order. */
export function preloadOrder(files: readonly string[]): string[] {
  return PRELOAD.flatMap((pattern) => files.filter((file) => pattern.test(file)).sort(cudnnFirst));
}

// "did not self-register" is expected: it is not a Node addon, but the library stays loaded.
function unlessExpected(error: unknown): void {
  if (!/self-register|init function/i.test(String((error as Error).message))) throw error;
}

function load(path: string): void {
  try {
    process.dlopen({ exports: {} } as never, path, DLOPEN_FLAGS);
  } catch (error) {
    unlessExpected(error);
  }
}

let preloaded = false;

/** Loads the NVIDIA libraries of <modelsDir>/cuda/<major>/lib into the process, once. */
export function preloadCuda(modelsDir: string): void {
  if (preloaded) return;
  const lib = cudaLibraryFolder(modelsDir, requiredCudaMajor());
  if (!existsSync(lib)) throw new Error('bibliotecas CUDA não instaladas; rode npx gizzy setup');
  preloadOrder(readdirSync(lib)).forEach((file) => load(join(lib, file)));
  preloaded = true;
}
