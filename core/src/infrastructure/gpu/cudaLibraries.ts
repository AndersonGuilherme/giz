import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { downloadResumable } from '../download/resumableDownload.ts';
import { ensureOrtCuda, requiredCudaMajor } from './onnxRuntimeCuda.ts';

const NVIDIA = 'https://developer.download.nvidia.com/compute';
// The libraries the ONNX Runtime CUDA provider needs (cuDNN comes from its own manifest).
const CUDA_PACKAGES = ['cuda_cudart', 'libcublas', 'libcurand'];
const CUDNN_MANIFEST = `${NVIDIA}/cudnn/redist/redistrib_9.28.1.json`;
// The marker of a finished install keeps the motor's name, so existing installs are not downloaded again.
const DONE_MARKER = '.completo';

type Manifest = Record<string, { 'linux-x86_64'?: { relative_path: string } }>;
type CudnnManifest = { cudnn: { 'linux-x86_64': Record<string, { relative_path: string } | undefined> } };
type Archive = Readonly<{ name: string; url: string }>;
type Log = (message: string) => void;

/** <modelsDir>/cuda/<major>/lib: where the NVIDIA libraries are extracted. */
export const cudaLibraryFolder = (modelsDir: string, major: number): string => join(modelsDir, 'cuda', String(major), 'lib');

/** The oldest manifest of the major version (12.9.1 for CUDA 12, the last 13.0.x for 13): the least recent driver. */
export async function cudaManifestUrl(major: number, send: typeof fetch = fetch): Promise<string> {
  if (major === 12) return `${NVIDIA}/cuda/redist/redistrib_12.9.1.json`;
  const index = await (await send(`${NVIDIA}/cuda/redist/`)).text();
  const patch = (name: string) => Number(name.match(/\.(\d+)\.json/)?.[1]);
  const manifests = [...new Set(index.match(new RegExp(`redistrib_${major}\\.0\\.[0-9]+\\.json`, 'g')) ?? [])];
  const last = manifests.sort((first, second) => patch(first) - patch(second)).at(-1);
  if (!last) throw new Error(`não encontrei as bibliotecas do CUDA ${major} no site da NVIDIA`);
  return `${NVIDIA}/cuda/redist/${last}`;
}

async function archivesFor(major: number): Promise<Archive[]> {
  const cuda = (await (await fetch(await cudaManifestUrl(major))).json()) as Manifest;
  const cudnn = (await (await fetch(CUDNN_MANIFEST)).json()) as CudnnManifest;
  const cudnnPackage = cudnn.cudnn['linux-x86_64'][`cuda${major}`];
  if (!cudnnPackage) throw new Error(`cuDNN para CUDA ${major} não encontrado`);
  const cudaArchives = CUDA_PACKAGES.map((name) => ({ name, url: `${NVIDIA}/cuda/redist/${cuda[name]['linux-x86_64']?.relative_path}` }));
  return [...cudaArchives, { name: 'cudnn', url: `${NVIDIA}/cudnn/redist/${cudnnPackage.relative_path}` }];
}

// Only the lib/*.so* files of the archive go to lib/ (the stubs stay out); the archive is then deleted.
function extract(archive: string, folders: Readonly<{ base: string; lib: string }>): void {
  const temporary = join(folders.base, 'extract');
  rmSync(temporary, { recursive: true, force: true });
  mkdirSync(temporary, { recursive: true });
  execFileSync('tar', ['-xJf', archive, '-C', temporary, '--strip-components=1', '--wildcards', '*/lib/*.so*']);
  const libraries = readdirSync(join(temporary, 'lib')).filter((name) => name !== 'stubs');
  libraries.forEach((name) => renameSync(join(temporary, 'lib', name), join(folders.lib, name)));
  rmSync(temporary, { recursive: true, force: true });
  rmSync(archive);
}

async function install(archive: Archive, folders: Readonly<{ base: string; lib: string }>, log: Log): Promise<void> {
  const file = join(folders.base, 'archives', archive.url.split('/').pop() ?? archive.name);
  const onStart = (total: number) => log(`  baixando ${archive.name} (${(total / 1e6).toFixed(0)} MB)...`);
  await downloadResumable({ url: archive.url, destination: file, label: archive.name }, { onStart });
  extract(file, folders);
}

/** Downloads and extracts the NVIDIA libraries the provider asks for, once; returns the lib/ folder. */
export async function ensureCudaLibraries(modelsDir: string, log: Log): Promise<string> {
  const major = requiredCudaMajor();
  const lib = cudaLibraryFolder(modelsDir, major);
  const base = dirname(lib);
  if (existsSync(join(base, DONE_MARKER))) return lib;
  mkdirSync(lib, { recursive: true });
  log(`  ONNX Runtime pede CUDA ${major}: baixando as bibliotecas da NVIDIA para ${base}`);
  for (const archive of await archivesFor(major)) await install(archive, { base, lib }, log);
  rmSync(join(base, 'archives'), { recursive: true, force: true });
  writeFileSync(join(base, DONE_MARKER), new Date().toISOString());
  return lib;
}

/** Everything the voice needs to run on the GPU: the CUDA provider and the NVIDIA libraries. */
export async function installGpu(modelsDir: string, log: Log): Promise<void> {
  ensureOrtCuda(log);
  await ensureCudaLibraries(modelsDir, log);
}
