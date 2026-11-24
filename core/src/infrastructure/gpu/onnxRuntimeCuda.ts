import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

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

// Without the npm_* variables: when called from `npm run`, the ONNX Runtime installer thinks it is a local install
// and exits; the ONNXRUNTIME_NODE_INSTALL* ones would make it skip CUDA again.
function installerEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^npm_|^ONNXRUNTIME_NODE_INSTALL/i.test(name)));
}

/** Downloads the ONNX Runtime CUDA provider with the package's own installer, if it is not there yet. */
export function ensureOrtCuda(log: (message: string) => void): void {
  if (ortHasCuda()) return;
  const script = join(packageFolder(), 'script', 'install.js');
  log('  baixando o ONNX Runtime com CUDA...');
  const options = { stdio: 'inherit', cwd: dirname(script), env: installerEnvironment() } as const;
  execFileSync(process.execPath, [script, '--onnxruntime-node-install=cuda12'], options);
  if (!ortHasCuda()) throw new Error('o ONNX Runtime não instalou o provider CUDA');
}
