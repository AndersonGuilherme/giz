import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { installOrtCuda, type OrtCudaReport } from './ortCudaInstall.ts';
import { copyOrtRuntime, ortPackageFolder, ortRuntimeFolder, ortVersion } from './ortRuntime.ts';

const providerPath = () => join(ortRuntimeFolder(), 'libonnxruntime_providers_cuda.so');

/**
 * Whether ONNX Runtime has its CUDA provider: core's onnxruntime-node (it installs with ONNXRUNTIME_NODE_INSTALL_CUDA=skip)
 * or, in the installed Studio, its writable copy (see ortRuntime.ts).
 */
export const ortHasCuda = (): boolean => existsSync(providerPath());

/** The CUDA major version named inside the provider binary ("libcudart.so.NN"). */
export function cudaMajorIn(binary: string): number {
  const found = binary.match(/libcudart\.so\.(\d+)/);
  if (!found) throw new Error('não consegui descobrir a versão do CUDA exigida pelo ONNX Runtime');
  return Number(found[1]);
}

/** The CUDA major version the installed provider needs. */
export const requiredCudaMajor = (): number => cudaMajorIn(readFileSync(providerPath()).toString('latin1'));

/**
 * Downloads the ONNX Runtime CUDA provider (resumable, `onProgress`: its bytes) next to ONNX Runtime, if it is not
 * there yet; with a writable copy (GIZ_ORT_DIR), the library is copied there first.
 */
export async function ensureOrtCuda(modelsDir: string, log: (message: string) => void, onProgress: OrtCudaReport['onProgress']): Promise<void> {
  if (ortHasCuda()) return;
  const folder = ortRuntimeFolder();
  if (folder !== ortPackageFolder()) await copyOrtRuntime(ortPackageFolder(), folder);
  await installOrtCuda({ modelsDir, binFolder: folder, version: ortVersion() }, { log, onProgress });
  if (!ortHasCuda()) throw new Error('o ONNX Runtime não instalou o provider CUDA');
}
