import { join } from 'node:path';
import { downloadResumable, type DownloadProgress } from '../download/resumableDownload.ts';
import { plainRelativePath, refuseAnotherFile } from '../download/verifiedFile.ts';

// The NVIDIA archives the ONNX Runtime CUDA provider needs, read from NVIDIA's redistrib manifests (fetched over
// HTTPS). Each manifest entry publishes the archive's path, sha256 and size: an archive is used only when its bytes
// match both, and a path that would leave NVIDIA's redist folder is refused before anything is downloaded.
const NVIDIA = 'https://developer.download.nvidia.com/compute';
// The libraries the ONNX Runtime CUDA provider needs (cuDNN comes from its own manifest).
const CUDA_PACKAGES = ['cuda_cudart', 'libcublas', 'libcurand'];
const CUDNN_MANIFEST = `${NVIDIA}/cudnn/redist/redistrib_9.28.1.json`;

type Entry = Readonly<{ relative_path?: unknown; sha256?: unknown; size?: unknown }>;
type Manifest = Readonly<Record<string, Readonly<{ 'linux-x86_64'?: Entry }> | undefined>>;
type CudnnManifest = Readonly<{ cudnn?: Readonly<{ 'linux-x86_64'?: Readonly<Record<string, Entry | undefined>> }> }>;
export type Archive = Readonly<{ name: string; url: string; sha256: string; bytes: number }>;
export type ArchiveReport = Readonly<{ log: (message: string) => void; onProgress: (progress: DownloadProgress) => void; fetch?: typeof fetch }>;

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

// An entry is usable only with a plain path, a sha256 of 64 hex digits and a positive size.
function archiveOf(name: string, entry: Entry | undefined, folder: string): Archive {
  const { relative_path: path, sha256, size } = entry ?? {};
  const bytes = Number(size);
  const hashed = typeof sha256 === 'string' && /^[0-9a-f]{64}$/i.test(sha256);
  if (typeof path !== 'string' || !hashed || !(bytes > 0)) throw new Error(`o manifesto da NVIDIA não traz caminho, hash e tamanho de ${name}`);
  return { name, url: `${folder}/${plainRelativePath(path, `manifesto da NVIDIA (${name})`)}`, sha256: sha256.toLowerCase(), bytes };
}

const json = async <T>(send: typeof fetch, url: string): Promise<T> => (await (await send(url)).json()) as T;

/** The archives to install for CUDA `major`, each with the hash and size its manifest publishes. */
export async function cudaArchivesOf(major: number, send: typeof fetch = fetch): Promise<Archive[]> {
  const cuda = await json<Manifest>(send, await cudaManifestUrl(major, send));
  const cudnn = await json<CudnnManifest>(send, CUDNN_MANIFEST);
  const cudnnEntry = cudnn.cudnn?.['linux-x86_64']?.[`cuda${major}`];
  if (!cudnnEntry) throw new Error(`cuDNN para CUDA ${major} não encontrado`);
  const cudaArchives = CUDA_PACKAGES.map((name) => archiveOf(name, cuda[name]?.['linux-x86_64'], `${NVIDIA}/cuda/redist`));
  return [...cudaArchives, archiveOf('cudnn', cudnnEntry, `${NVIDIA}/cudnn/redist`)];
}

/** Downloads one archive into `<base>/archives` (resumable, of its published size) and checks it; returns its file. */
export async function downloadArchive(archive: Archive, base: string, { log, onProgress, fetch: send }: ArchiveReport): Promise<string> {
  const file = join(base, 'archives', archive.url.split('/').pop() ?? archive.name);
  log(`  baixando ${archive.name} (${(archive.bytes / 1e6).toFixed(0)} MB)...`);
  const onBytes = (receivedBytes: number) => onProgress({ label: archive.name, receivedBytes, totalBytes: archive.bytes });
  const download = { url: archive.url, destination: file, label: archive.name, expectedBytes: archive.bytes };
  await downloadResumable(download, { onBytes, ...(send ? { fetch: send } : {}) });
  await refuseAnotherFile(file, archive.sha256, archive.name);
  return file;
}
