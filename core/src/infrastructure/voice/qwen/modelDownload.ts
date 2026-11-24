import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { downloadResumable } from '../../download/resumableDownload.ts';
import { modelFolder } from './qwenModels.ts';

type TreeEntry = Readonly<{ type: string; path: string; size: number }>;
type Log = (message: string) => void;
// The marker of a finished download keeps the motor's name, so existing installs are not downloaded again.
const DONE_MARKER = '.completo';
const HUGGING_FACE = 'https://huggingface.co';

async function modelFiles(repository: string): Promise<TreeEntry[]> {
  const response = await fetch(`${HUGGING_FACE}/api/models/${repository}/tree/main?recursive=true`);
  const tree = (await response.json()) as TreeEntry[];
  return tree.filter((entry) => entry.type === 'file' && !entry.path.startsWith('.') && entry.path !== 'README.md');
}

const gigabytes = (bytes: number) => (bytes / 1e9).toFixed(1);

/** Downloads the voice model once (resuming an interrupted download); returns its folder. */
export async function ensureModel(repository: string, modelsDir: string, log: Log = console.log): Promise<string> {
  const folder = modelFolder(repository, modelsDir);
  if (existsSync(join(folder, DONE_MARKER))) return folder;
  const files = await modelFiles(repository);
  const total = files.reduce((sum, file) => sum + file.size, 0);
  log(`Baixando o modelo de voz Qwen3-TTS (${gigabytes(total)} GB, só na primeira vez) para ${folder}`);
  let downloaded = 0;
  for (const file of files) {
    const url = `${HUGGING_FACE}/${repository}/resolve/main/${file.path}`;
    await downloadResumable({ url, destination: join(folder, file.path), label: file.path, expectedBytes: file.size });
    downloaded += file.size;
    log(`  ${(downloaded / 1e9).toFixed(2)}/${gigabytes(total)} GB  ${file.path}`);
  }
  writeFileSync(join(folder, DONE_MARKER), new Date().toISOString());
  return folder;
}
