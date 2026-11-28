import { createHash } from 'node:crypto';
import { createReadStream, accessSync, constants, mkdirSync, renameSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { downloadResumable, type DownloadProgress } from '../download/resumableDownload.ts';
import { extractZipEntry, zipEntriesOf } from '../download/zipEntries.ts';

// The ONNX Runtime CUDA provider is too big for npm: onnxruntime-node's own installer fetches it from NuGet. That
// installer is a script run by a second Node; inside the installed Studio there is no Node (Electron's RunAsNode is
// off), so the package is downloaded here instead (resumable, with progress, like the models), checked against the
// hash NuGet publishes, and the provider files are streamed out of it next to the ONNX Runtime library that loads them.
const NUGET = 'https://api.nuget.org/v3-flatcontainer/microsoft.ml.onnxruntime.gpu.linux';
const IN_PACKAGE = 'runtimes/linux-x64/native';
// The shared bridge first: the CUDA provider's presence is what tells the install is done.
const PROVIDER_FILES = ['libonnxruntime_providers_shared.so', 'libonnxruntime_providers_cuda.so'];

/** NuGet's `packageHash` (sha512, base64) and `packageSize` of Microsoft.ML.OnnxRuntime.Gpu.Linux, by ORT version. */
export type KnownPackage = Readonly<{ sha512: string; bytes: number }>;
export const ORT_CUDA_PACKAGES: Readonly<Record<string, KnownPackage>> = {
  '1.31.1': { sha512: 'iB4gKnPUwfeJN01l5Yeuz40Uy1IM/8v1pj/DTrvslbqYNsMEBhw4Mp8LcJgDAGo7zkLlkSFqgJCV9zWXkMgdjQ==', bytes: 244_926_281 },
};

/** The NuGet package of the CUDA provider for an ONNX Runtime version: its URL, hash and size. */
export function ortCudaPackageOf(version: string, packages: Readonly<Record<string, KnownPackage>> = ORT_CUDA_PACKAGES): KnownPackage & { url: string } {
  const known = packages[version];
  if (!known) throw new Error(`não conheço o pacote CUDA do ONNX Runtime ${version}: acrescente o hash e o tamanho dele em ortCudaInstall.ts`);
  return { ...known, url: `${NUGET}/${version}/microsoft.ml.onnxruntime.gpu.linux.${version}.nupkg` };
}

/** `binFolder`: where onnxruntime-node's library is (the provider goes beside it); the package waits in `modelsDir`. */
export type OrtCudaTarget = Readonly<{ modelsDir: string; binFolder: string; version: string }>;
export type OrtCudaReport = Readonly<{ log: (message: string) => void; onProgress: (progress: DownloadProgress) => void }>;
/** Tests replace the download and the table of known packages. */
export type OrtCudaTools = Readonly<{ download?: typeof downloadResumable; packages?: Readonly<Record<string, KnownPackage>> }>;

function refuseReadOnly(folder: string): void {
  try {
    accessSync(folder, constants.W_OK);
  } catch {
    throw new Error(`a pasta do ONNX Runtime (${folder}) não aceita escrita: o provider CUDA não pode ser instalado nela`);
  }
}

async function refuseAnotherFile(archive: string, sha512: string): Promise<void> {
  const hash = createHash('sha512');
  await pipeline(createReadStream(archive), hash);
  if (hash.digest('base64') !== sha512) throw new Error('o pacote do ONNX Runtime GPU baixado não confere com o publicado no NuGet');
}

// Every entry is found before any is written, and each lands under its name only when whole.
async function extract(archive: string, binFolder: string): Promise<void> {
  const entries = await zipEntriesOf(archive);
  const wanted = PROVIDER_FILES.map((name) => ({ name, entry: entries.get(`${IN_PACKAGE}/${name}`) }));
  const missing = wanted.find(({ entry }) => !entry);
  if (missing) throw new Error(`o pacote do ONNX Runtime GPU não tem ${missing.name}`);
  for (const { name, entry } of wanted) {
    await extractZipEntry(archive, entry!, join(binFolder, `${name}.part`));
    renameSync(join(binFolder, `${name}.part`), join(binFolder, name));
  }
}

/** Downloads the CUDA provider package of `target.version`, checks it and puts the provider next to ONNX Runtime. */
export async function installOrtCuda(target: OrtCudaTarget, report: OrtCudaReport, tools: OrtCudaTools = {}): Promise<void> {
  const known = ortCudaPackageOf(target.version, tools.packages);
  refuseReadOnly(target.binFolder);
  const folder = join(target.modelsDir, 'onnxruntime');
  mkdirSync(folder, { recursive: true });
  const archive = join(folder, `onnxruntime-gpu-linux-${target.version}.nupkg`);
  const label = 'ONNX Runtime CUDA';
  report.log('  baixando o ONNX Runtime com CUDA...');
  const onBytes = (receivedBytes: number) => report.onProgress({ label, receivedBytes, totalBytes: known.bytes });
  await (tools.download ?? downloadResumable)({ url: known.url, destination: archive, label, expectedBytes: known.bytes }, { onBytes });
  try {
    await refuseAnotherFile(archive, known.sha512);
    await extract(archive, target.binFolder);
  } finally {
    await rm(archive, { force: true });
  }
}
