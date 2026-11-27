import { accessSync, constants, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { downloadResumable, type DownloadProgress } from '../download/resumableDownload.ts';

// The ONNX Runtime CUDA provider is too big for npm: onnxruntime-node's own installer fetches it from NuGet. That
// installer is a script run by a second Node; inside the installed Studio there is no Node (Electron's RunAsNode is
// off), so the package is downloaded here instead (resumable, with progress, like the models) and the provider files are
// taken out of it, next to the ONNX Runtime library that loads them.
const NUGET = 'https://api.nuget.org/v3-flatcontainer/microsoft.ml.onnxruntime.gpu.linux';
const IN_PACKAGE = 'runtimes/linux-x64/native';
// The shared bridge first: the CUDA provider's presence is what tells the install is done.
const PROVIDER_FILES = ['libonnxruntime_providers_shared.so', 'libonnxruntime_providers_cuda.so'];

/** The NuGet package of the CUDA provider for the given ONNX Runtime version. */
export const ortCudaPackageUrl = (version: string): string => `${NUGET}/${version}/microsoft.ml.onnxruntime.gpu.linux.${version}.nupkg`;

/** `binFolder`: where onnxruntime-node keeps its library (the provider goes beside it); the package waits in `modelsDir`. */
export type OrtCudaTarget = Readonly<{ modelsDir: string; binFolder: string; version: string }>;
export type OrtCudaReport = Readonly<{ log: (message: string) => void; onProgress: (progress: DownloadProgress) => void }>;
type Fetcher = typeof downloadResumable;

type ZipEntry = { getData(): Buffer };
type Zip = { getEntry(name: string): ZipEntry | null };
type ZipReader = new (path: string) => Zip;

// adm-zip comes with onnxruntime-node (its installer reads the same package with it).
const zipReader = (): ZipReader => createRequire(createRequire(import.meta.url).resolve('onnxruntime-node/package.json'))('adm-zip') as ZipReader;

function refuseReadOnly(folder: string): void {
  try {
    accessSync(folder, constants.W_OK);
  } catch {
    throw new Error(`a pasta do ONNX Runtime (${folder}) não aceita escrita: o provider CUDA não pode ser instalado nela`);
  }
}

function entryOf(zip: Zip, name: string): Buffer {
  const entry = zip.getEntry(`${IN_PACKAGE}/${name}`);
  if (!entry) throw new Error(`o pacote do ONNX Runtime GPU não tem ${name}`);
  return entry.getData();
}

// Every file is read before any is written, and each lands under its name only when whole.
function extract(archive: string, binFolder: string): void {
  const zip = new (zipReader())(archive);
  const contents = PROVIDER_FILES.map((name) => ({ name, data: entryOf(zip, name) }));
  for (const { name, data } of contents) {
    writeFileSync(join(binFolder, `${name}.part`), data);
    renameSync(join(binFolder, `${name}.part`), join(binFolder, name));
  }
}

/** Downloads the CUDA provider package of `target.version` and puts the provider next to ONNX Runtime. */
export async function installOrtCuda(target: OrtCudaTarget, report: OrtCudaReport, download: Fetcher = downloadResumable): Promise<void> {
  refuseReadOnly(target.binFolder);
  const folder = join(target.modelsDir, 'onnxruntime');
  mkdirSync(folder, { recursive: true });
  const archive = join(folder, `onnxruntime-gpu-linux-${target.version}.nupkg`);
  const label = 'ONNX Runtime CUDA';
  let totalBytes = 0;
  report.log('  baixando o ONNX Runtime com CUDA...');
  const onStart = (total: number) => void (totalBytes = total);
  const onBytes = (receivedBytes: number) => report.onProgress({ label, receivedBytes, totalBytes });
  await download({ url: ortCudaPackageUrl(target.version), destination: archive, label }, { onStart, onBytes });
  extract(archive, target.binFolder);
  rmSync(archive, { force: true });
}
