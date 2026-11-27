import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { installOrtCuda, type OrtCudaReport } from './ortCudaInstall.ts';

const require = createRequire(import.meta.url);
const packageFolder = () => dirname(require.resolve('onnxruntime-node/package.json'));

function binaryFolder(): string {
  const base = join(packageFolder(), 'bin');
  const napi = readdirSync(base).find((name) => name.startsWith('napi-')) ?? '';
  return join(base, napi, process.platform, process.arch);
}

const providerPath = () => join(binaryFolder(), 'libonnxruntime_providers_cuda.so');

/** Whether core's onnxruntime-node has its CUDA provider (it installs with ONNXRUNTIME_NODE_INSTALL_CUDA=skip). */
export const ortHasCuda = (): boolean => existsSync(providerPath());

/** The CUDA major version named inside the provider binary ("libcudart.so.NN"). */
export function cudaMajorIn(binary: string): number {
  const found = binary.match(/libcudart\.so\.(\d+)/);
  if (!found) throw new Error('não consegui descobrir a versão do CUDA exigida pelo ONNX Runtime');
  return Number(found[1]);
}

/** The CUDA major version the installed provider needs. */
export const requiredCudaMajor = (): number => cudaMajorIn(readFileSync(providerPath()).toString('latin1'));

/** The ONNX Runtime version of core's onnxruntime-node (its CUDA provider must be the same one). */
const ortVersion = (): string => (JSON.parse(readFileSync(require.resolve('onnxruntime-node/package.json'), 'utf8')) as { version: string }).version;

/** Downloads the ONNX Runtime CUDA provider (resumable, `onProgress`: its bytes) next to ONNX Runtime, if it is not there yet. */
export async function ensureOrtCuda(modelsDir: string, log: (message: string) => void, onProgress: OrtCudaReport['onProgress']): Promise<void> {
  if (ortHasCuda()) return;
  await installOrtCuda({ modelsDir, binFolder: binaryFolder(), version: ortVersion() }, { log, onProgress });
  if (!ortHasCuda()) throw new Error('o ONNX Runtime não instalou o provider CUDA');
}
