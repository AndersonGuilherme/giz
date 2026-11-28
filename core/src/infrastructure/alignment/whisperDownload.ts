import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { DownloadProgress } from '../download/resumableDownload.ts';
import { refuseAnotherFile } from '../download/verifiedFile.ts';
import { loadRecognizer, whisperCacheOf, WHISPER_HASHES, WHISPER_MODEL, WHISPER_REVISION, type RecognizerOptions } from './whisperModel.ts';

// transformers writes each file straight to its final name and cannot resume: a download stopped halfway would leave
// a broken model that looks complete. So the explicit download (`giz models --whisper`, the Studio) goes to a partial
// folder, and only a model that loaded and whose weights match the pinned hashes is moved into the cache, with a
// marker that says it is whole. With a pinned revision, transformers keeps the files in <model>/<revision>/.
const DONE_MARKER = '.giz-complete';
const PARTIAL = '.giz-partial';
const WHISPER_FILES = ['config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx'];

// transformers' default cache: the .cache folder of its own package (where loadRecognizer reads from), unless
// GIZ_WHISPER_CACHE names another. Its entry is <package>/dist/<file>; its package.json is not in its exports, so it
// cannot be resolved directly.
const packageCache = () => join(dirname(dirname(createRequire(import.meta.url).resolve('@huggingface/transformers'))), '.cache');
const transformersCache = () => whisperCacheOf(process.env) ?? packageCache();

/** Whether Whisper (q8) was downloaded whole into the cache: its files and the done marker (checked without loading transformers). */
export function whisperDownloaded(cache: string = transformersCache()): boolean {
  const folder = join(cache, WHISPER_MODEL, WHISPER_REVISION);
  return existsSync(join(folder, DONE_MARKER)) && WHISPER_FILES.every((file) => existsSync(join(folder, file)));
}

type Load = (options: RecognizerOptions) => Promise<unknown>;
/** `load` and `hashes`: another loader and other weights' hashes (tests). */
export type WhisperDownload = Readonly<{ onProgress?: (progress: DownloadProgress) => void; cache?: string; load?: Load; hashes?: Readonly<Record<string, string>> }>;

async function refuseOtherWeights(folder: string, hashes: Readonly<Record<string, string>>): Promise<void> {
  for (const [file, sha256] of Object.entries(hashes)) await refuseAnotherFile(join(folder, file), sha256, file);
}

/** Downloads Whisper into a partial folder, loads it once and checks its weights, then moves it into the cache with its marker. */
export async function downloadWhisperModel({ onProgress, cache = transformersCache(), load = loadRecognizer, hashes = WHISPER_HASHES }: WhisperDownload = {}): Promise<void> {
  const partial = join(cache, PARTIAL);
  rmSync(partial, { recursive: true, force: true });
  try {
    await load({ onProgress, cacheDir: partial });
    await refuseOtherWeights(join(partial, WHISPER_MODEL, WHISPER_REVISION), hashes);
    const folder = join(cache, WHISPER_MODEL);
    rmSync(folder, { recursive: true, force: true });
    mkdirSync(dirname(folder), { recursive: true });
    renameSync(join(partial, WHISPER_MODEL), folder);
    writeFileSync(join(folder, WHISPER_REVISION, DONE_MARKER), new Date().toISOString());
  } finally {
    rmSync(partial, { recursive: true, force: true });
  }
}
