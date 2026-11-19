// GPU NVIDIA para a voz (Qwen3-TTS via ONNX Runtime), SEM sudo e sem instalar o CUDA Toolkit no sistema:
//   1. o ONNX Runtime baixa o seu "CUDA Execution Provider" (libonnxruntime_providers_cuda.so)
//   2. a versão do CUDA que ele exige (12 ou 13) é lida do próprio arquivo, e as bibliotecas oficiais da NVIDIA
//      (CUDA runtime, cuBLAS, cuRAND e cuDNN 9) são baixadas dos redistribuíveis públicos
//      (developer.download.nvidia.com) para <modelsDir>/cuda/<versão>/lib
//   3. antes de abrir o modelo, essas bibliotecas são pré-carregadas no processo (preloadCuda)
// Só o driver da NVIDIA precisa estar instalado (no WSL, vem do driver do Windows). Só Linux x64 (inclui WSL).
// Uso direto: node scripts/gpu.ts instalar | info
import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { loadConfig } from './config.ts';

const NV = 'https://developer.download.nvidia.com/compute';
// bibliotecas de que o provider CUDA do ONNX Runtime precisa, na ordem em que devem ser carregadas
const CUDA_PACKAGES = ['cuda_cudart', 'libcublas', 'libcurand'];
const PRELOAD = [/^libcudart\.so\.\d+$/, /^libcublasLt\.so\.\d+$/, /^libcublas\.so\.\d+$/, /^libcurand\.so\.\d+$/, /^libcudnn.*\.so\.\d+$/];

export type GpuInfo = { name: string; memoryMiB: number; driver: string };
export function detectNvidia(): GpuInfo | null {
  if (process.platform !== 'linux' || process.arch !== 'x64') return null;
  try {
    const out = execFileSync('nvidia-smi', ['--query-gpu=name,memory.total,driver_version', '--format=csv,noheader,nounits'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const [name, mem, driver] = out.trim().split('\n')[0].split(',').map((s) => s.trim());
    return { name, memoryMiB: Number(mem), driver };
  } catch { return null; }
}

function ortBinDir(): string {
  const require = createRequire(import.meta.url);
  const base = join(dirname(require.resolve('onnxruntime-node/package.json')), 'bin');
  const napi = readdirSync(base).find((d) => d.startsWith('napi-'))!;
  return join(base, napi, process.platform, process.arch);
}
const providerPath = () => join(ortBinDir(), 'libonnxruntime_providers_cuda.so');
export const ortHasCuda = () => existsSync(providerPath());

// versão maior do CUDA exigida pelo provider (lê "libcudart.so.NN" dentro do binário)
export function requiredCudaMajor(): number {
  const m = readFileSync(providerPath()).toString('latin1').match(/libcudart\.so\.(\d+)/);
  if (!m) throw new Error('não consegui descobrir a versão do CUDA exigida pelo ONNX Runtime');
  return Number(m[1]);
}
export const cudaLibDir = (major = requiredCudaMajor()) => join(loadConfig().modelsDir, 'cuda', String(major), 'lib');

async function download(url: string, dst: string, label: string) {
  if (existsSync(dst)) return;
  mkdirSync(dirname(dst), { recursive: true });
  const part = `${dst}.part`;
  const have = existsSync(part) ? statSync(part).size : 0; // retoma download interrompido
  const res = await fetch(url, { headers: have ? { Range: `bytes=${have}-` } : {} });
  if (!res.ok || !res.body) throw new Error(`falha ao baixar ${url}: HTTP ${res.status}`);
  const append = have > 0 && res.status === 206;
  const total = Number(res.headers.get('content-length') ?? 0) + (append ? have : 0);
  process.stdout.write(`  baixando ${label} (${(total / 1e6).toFixed(0)} MB)...`);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(part, { flags: append ? 'a' : 'w' }));
  if (total && statSync(part).size !== total) throw new Error(`download incompleto de ${label}; rode de novo para retomar`);
  renameSync(part, dst);
  process.stdout.write(' ok\n');
}

// manifesto mais antigo da versão maior (12.9 para CUDA 12; 13.0.x para CUDA 13): exige o driver menos recente
async function cudaManifest(major: number): Promise<string> {
  if (major === 12) return `${NV}/cuda/redist/redistrib_12.9.1.json`;
  const index = await (await fetch(`${NV}/cuda/redist/`)).text();
  const all = [...new Set(index.match(new RegExp(`redistrib_${major}\\.0\\.[0-9]+\\.json`, 'g')) ?? [])];
  const last = all.sort((a, b) => Number(a.match(/\.(\d+)\.json/)![1]) - Number(b.match(/\.(\d+)\.json/)![1])).at(-1);
  if (!last) throw new Error(`não encontrei as bibliotecas do CUDA ${major} no site da NVIDIA`);
  return `${NV}/cuda/redist/${last}`;
}

// baixa e extrai as bibliotecas da NVIDIA; devolve a pasta lib/
export async function ensureCudaLibs(): Promise<string> {
  const major = requiredCudaMajor();
  const lib = cudaLibDir(major), dir = dirname(lib);
  if (existsSync(join(dir, '.completo'))) return lib;
  mkdirSync(lib, { recursive: true });
  type Manifest = Record<string, { 'linux-x86_64'?: { relative_path: string } }>;
  const cuda = (await (await fetch(await cudaManifest(major))).json()) as Manifest;
  const cudnn = (await (await fetch(`${NV}/cudnn/redist/redistrib_9.28.1.json`)).json()) as { cudnn: { 'linux-x86_64': Record<string, { relative_path: string }> } };
  const cudnnPkg = cudnn.cudnn['linux-x86_64'][`cuda${major}`];
  if (!cudnnPkg) throw new Error(`cuDNN para CUDA ${major} não encontrado`);
  const archives = [
    ...CUDA_PACKAGES.map((p) => ({ name: p, url: `${NV}/cuda/redist/${cuda[p]['linux-x86_64']!.relative_path}` })),
    { name: 'cudnn', url: `${NV}/cudnn/redist/${cudnnPkg.relative_path}` },
  ];
  console.log(`  ONNX Runtime pede CUDA ${major}: baixando as bibliotecas da NVIDIA para ${dir}`);
  for (const a of archives) {
    const file = join(dir, 'arquivos', a.url.split('/').pop()!);
    await download(a.url, file, a.name);
    const tmp = join(dir, 'extrair');
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp, { recursive: true });
    execFileSync('tar', ['-xJf', file, '-C', tmp, '--strip-components=1', '--wildcards', '*/lib/*.so*']);
    for (const f of readdirSync(join(tmp, 'lib'))) if (f !== 'stubs') renameSync(join(tmp, 'lib', f), join(lib, f));
    rmSync(tmp, { recursive: true, force: true });
    rmSync(file); // o arquivo compactado não é mais necessário
  }
  rmSync(join(dir, 'arquivos'), { recursive: true, force: true });
  writeFileSync(join(dir, '.completo'), new Date().toISOString());
  return lib;
}

// baixa o provider CUDA do ONNX Runtime (o instalador oficial do pacote faz isso)
export function ensureOrtCuda() {
  if (ortHasCuda()) return;
  const require = createRequire(import.meta.url);
  const script = join(dirname(require.resolve('onnxruntime-node/package.json')), 'script', 'install.js');
  console.log('  baixando o ONNX Runtime com CUDA...');
  // sem as variáveis npm_* (quando chamado por `npm run`, o instalador do ONNX Runtime se acha "instalação local" e sai)
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^npm_|^ONNXRUNTIME_NODE_INSTALL/i.test(k)));
  execFileSync(process.execPath, [script, '--onnxruntime-node-install=cuda12'], { stdio: 'inherit', cwd: dirname(script), env });
  if (!ortHasCuda()) throw new Error('o ONNX Runtime não instalou o provider CUDA');
}

export async function installGpu() {
  ensureOrtCuda();
  await ensureCudaLibs();
}

// O provider CUDA procura as bibliotecas pelo nome (libcublas.so.13...) só nas pastas do sistema. Carregá-las
// antes, por caminho completo, faz o sistema reaproveitá-las. RTLD_NODELETE (0x1000) as mantém carregadas.
let preloaded = false;
export function preloadCuda() {
  if (preloaded) return;
  const lib = cudaLibDir();
  if (!existsSync(lib)) throw new Error('bibliotecas CUDA não instaladas; rode npm run setup');
  const files = readdirSync(lib);
  const flags = 0x2 | 0x100 | 0x1000; // RTLD_NOW | RTLD_GLOBAL | RTLD_NODELETE
  for (const re of PRELOAD) {
    for (const f of files.filter((x) => re.test(x)).sort((a, b) => Number(b.startsWith('libcudnn.so')) - Number(a.startsWith('libcudnn.so')))) {
      try { process.dlopen({ exports: {} } as never, join(lib, f), flags); } catch (e) {
        // "did not self-register" é esperado: não é um addon do Node, mas a biblioteca ficou carregada
        if (!/self-register|init function/i.test(String((e as Error).message))) throw e;
      }
    }
  }
  preloaded = true;
}

if (process.argv[1] === import.meta.filename) {
  const cmd = process.argv[2];
  if (cmd === 'instalar') { await installGpu(); console.log('GPU pronta para a voz.'); }
  else if (cmd === 'info') console.log({ gpu: detectNvidia(), providerCuda: ortHasCuda(), cuda: ortHasCuda() ? requiredCudaMajor() : null });
  else console.error('uso: node scripts/gpu.ts instalar | info');
}
