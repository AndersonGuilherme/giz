import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { downloadResumable } from '../../download/resumableDownload.ts';
import { modelFolder } from './qwenModels.ts';

type TreeEntry = Readonly<{ type: string; path: string; size: number }>;
type Log = (message: string) => void;
/** `onProgress` receives the bytes of the whole model on disk so far and its total (the Studio's progress bar). */
export type ModelDownloadOptions = Readonly<{ log?: Log; onProgress?: (receivedBytes: number, totalBytes: number) => void; fetch?: typeof fetch }>;
// The marker of a finished download keeps the motor's name, so existing installs are not downloaded again.
const DONE_MARKER = '.completo';
const HUGGING_FACE = 'https://huggingface.co';

async function modelFiles(repository: string, send: typeof fetch): Promise<TreeEntry[]> {
  const response = await send(`${HUGGING_FACE}/api/models/${repository}/tree/main?recursive=true`);
  const tree = (await response.json()) as TreeEntry[];
  return tree.filter((entry) => entry.type === 'file' && !entry.path.startsWith('.') && entry.path !== 'README.md');
}

const gigabytes = (bytes: number) => (bytes / 1e9).toFixed(1);
const DEFAULT_OPTIONS = { log: console.log, onProgress: () => undefined, fetch: (...args: Parameters<typeof fetch>) => fetch(...args) };

/** Whether the model was downloaded to the end (its done marker is there). */
export const modelReady = (repository: string, modelsDir: string): boolean => existsSync(join(modelFolder(repository, modelsDir), DONE_MARKER));

/** Downloads the voice model once (resuming an interrupted download), reporting its bytes; returns its folder. */
export async function downloadModel(repository: string, modelsDir: string, options: ModelDownloadOptions = {}): Promise<string> {
  const { log, onProgress, fetch: send } = { ...DEFAULT_OPTIONS, ...options };
  const folder = modelFolder(repository, modelsDir);
  if (modelReady(repository, modelsDir)) return folder;
  const files = await modelFiles(repository, send);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  log(`Baixando o modelo de voz Qwen3-TTS (${gigabytes(total)} GB, só na primeira vez) para ${folder}`);
  let downloaded = 0;
  for (const file of files) {
    const url = `${HUGGING_FACE}/${repository}/resolve/main/${file.path}`;
    const onBytes = (received: number) => onProgress(downloaded + received, total);
    await downloadResumable({ url, destination: join(folder, file.path), label: file.path, expectedBytes: file.size }, { fetch: send, onBytes });
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
