import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { downloadResumable } from '../../download/resumableDownload.ts';
import { plainRelativePath, refuseAnotherFile } from '../../download/verifiedFile.ts';
import { modelFolder, revisionOf } from './qwenModels.ts';

// The model comes from one pinned commit of its Hugging Face repository: the tree of that commit lists every file with
// its hash (the LFS sha256 for the weights, the git blob id for the small files), and a file is kept only when its
// bytes match it. A path in the tree that is not plain (`..`, absolute, backslash) is refused before any download.
type TreeEntry = Readonly<{ type: string; path: string; size: number; oid?: string; lfs?: Readonly<{ oid?: string }> }>;
type ModelFile = Readonly<{ path: string; size: number; hash: string; lfs: boolean }>;
type Log = (message: string) => void;
/**
 * `onProgress` receives the bytes of the whole model on disk so far and its total (the Studio's progress bar);
 * `revision`: another commit than the pinned one (tests).
 */
export type ModelDownloadOptions = Readonly<{ log?: Log; onProgress?: (receivedBytes: number, totalBytes: number) => void; fetch?: typeof fetch; revision?: string }>;
// The marker of a finished download keeps the motor's name, so existing installs are not downloaded again.
const DONE_MARKER = '.completo';
const HUGGING_FACE = 'https://huggingface.co';
const HEX = /^[0-9a-f]{40}([0-9a-f]{24})?$/i;

function modelFileOf(entry: TreeEntry): ModelFile {
  const path = plainRelativePath(entry.path, 'a lista de arquivos do modelo de voz');
  const lfs = entry.lfs?.oid !== undefined;
  const hash = (lfs ? entry.lfs?.oid : entry.oid) ?? '';
  if (!HEX.test(hash)) throw new Error(`a lista do modelo de voz não traz o hash de ${path}`);
  return { path, size: entry.size, hash, lfs };
}

async function modelFiles(repository: string, revision: string, send: typeof fetch): Promise<ModelFile[]> {
  const response = await send(`${HUGGING_FACE}/api/models/${repository}/tree/${revision}?recursive=true`);
  if (!response.ok) throw new Error(`não consegui ler a lista do modelo de voz ${repository}: HTTP ${response.status}`);
  const tree = (await response.json()) as TreeEntry[];
  const files = tree.filter((entry) => entry.type === 'file').map(modelFileOf);
  return files.filter(({ path }) => !path.startsWith('.') && path !== 'README.md');
}

const gigabytes = (bytes: number) => (bytes / 1e9).toFixed(1);
const DEFAULT_OPTIONS = { log: console.log, onProgress: () => undefined, fetch: (...args: Parameters<typeof fetch>) => fetch(...args) };

/** Whether the model was downloaded to the end (its done marker is there). */
export const modelReady = (repository: string, modelsDir: string): boolean => existsSync(join(modelFolder(repository, modelsDir), DONE_MARKER));

/** The folder of a model already downloaded; never downloads: without it, a readable error. */
export function openDownloadedModel(repository: string, modelsDir: string): string {
  if (!modelReady(repository, modelsDir)) throw new Error(`o modelo de voz ${repository} não foi baixado: baixe-o em Configurações (ou \`gizzy models\`)`);
  return modelFolder(repository, modelsDir);
}

type Source = Readonly<{ repository: string; revision: string; folder: string; send: typeof fetch }>;

async function fetchFile(file: ModelFile, source: Source, onBytes: (received: number) => void): Promise<void> {
  const url = `${HUGGING_FACE}/${source.repository}/resolve/${source.revision}/${file.path}`;
  const destination = join(source.folder, file.path);
  await downloadResumable({ url, destination, label: file.path, expectedBytes: file.size }, { fetch: source.send, onBytes });
  await refuseAnotherFile(destination, file.lfs ? file.hash : { gitOid: file.hash }, file.path);
}

/** Downloads the voice model once (resuming an interrupted download), reporting its bytes; returns its folder. */
export async function downloadModel(repository: string, modelsDir: string, options: ModelDownloadOptions = {}): Promise<string> {
  const { log, onProgress, fetch: send, revision = revisionOf(repository) } = { ...DEFAULT_OPTIONS, ...options };
  const folder = modelFolder(repository, modelsDir);
  if (modelReady(repository, modelsDir)) return folder;
  const files = await modelFiles(repository, revision, send);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  log(`Baixando o modelo de voz Qwen3-TTS (${gigabytes(total)} GB, só na primeira vez) para ${folder}`);
  let downloaded = 0;
  for (const file of files) {
    await fetchFile(file, { repository, revision, folder, send }, (received) => onProgress(downloaded + received, total));
    downloaded += file.size;
    onProgress(downloaded, total);
    log(`  ${(downloaded / 1e9).toFixed(2)}/${gigabytes(total)} GB  ${file.path}`);
  }
  writeFileSync(join(folder, DONE_MARKER), new Date().toISOString());
  return folder;
}

/** Downloads the voice model once (resuming an interrupted download); returns its folder. */
export function ensureModel(repository: string, modelsDir: string, log: Log = console.log): Promise<string> {
  return downloadModel(repository, modelsDir, { log });
}
