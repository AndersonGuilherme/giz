import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadWhisperModel, whisperDownloaded } from '../../../src/infrastructure/alignment/whisperDownload.ts';
import { createHash } from 'node:crypto';
import { recognizerOptions, WHISPER_MODEL, WHISPER_REVISION, whisperProgressOf } from '../../../src/infrastructure/alignment/whisperModel.ts';

const FILES = ['config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx'];
// With a pinned revision, transformers caches the files under <model>/<revision>/.
const MODEL = join(WHISPER_MODEL, WHISPER_REVISION);
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const hashesOf = (content: string) => ({ 'onnx/encoder_model_quantized.onnx': sha256(content), 'onnx/decoder_model_merged_quantized.onnx': sha256(content) });

function writeModel(folder: string, content = 'x'): void {
  mkdirSync(join(folder, 'onnx'), { recursive: true });
  FILES.forEach((file) => writeFileSync(join(folder, file), content));
}

test('Whisper counts as downloaded only with its files AND the done marker (files left by a stopped download are not)', () => {
  const cache = mkdtempSync(join(tmpdir(), 'gizzy-whisper-'));
  assert.equal(whisperDownloaded(cache), false);
  writeModel(join(cache, MODEL));
  assert.equal(whisperDownloaded(cache), false);
  writeFileSync(join(cache, MODEL, '.gizzy-complete'), 'x');
  assert.equal(whisperDownloaded(cache), true);
});

test('a download marked whole before the rename (.giz-complete) still counts: it is not downloaded again', () => {
  const cache = mkdtempSync(join(tmpdir(), 'gizzy-whisper-'));
  writeModel(join(cache, MODEL));
  writeFileSync(join(cache, MODEL, '.giz-complete'), 'x');
  assert.equal(whisperDownloaded(cache), true);
});

test('the download goes to a partial folder and only a model that loaded moves into the cache, replacing a broken one', async () => {
  const cache = mkdtempSync(join(tmpdir(), 'gizzy-whisper-'));
  writeModel(join(cache, WHISPER_MODEL), 'old layout of main');
  const seen: string[] = [];
  const load = async ({ cacheDir }: { cacheDir?: string }) => {
    seen.push(cacheDir ?? '');
    writeModel(join(cacheDir ?? '', MODEL), 'whole');
  };
  await downloadWhisperModel({ cache, load, hashes: hashesOf('whole') });
  assert.deepEqual(seen, [join(cache, '.gizzy-partial')]);
  assert.equal(readFileSync(join(cache, MODEL, 'config.json'), 'utf8'), 'whole');
  assert.equal(existsSync(join(cache, WHISPER_MODEL, 'config.json')), false, 'the unpinned files are gone');
  assert.equal(whisperDownloaded(cache), true);
  assert.ok(existsSync(join(cache, MODEL, '.gizzy-complete')), 'a new download gets the new marker');
  assert.equal(existsSync(join(cache, '.gizzy-partial')), false);
});

test('a download that fails (or is stopped) leaves the cache as it was: no marker, nothing moved', async () => {
  const cache = mkdtempSync(join(tmpdir(), 'gizzy-whisper-'));
  const load = async ({ cacheDir }: { cacheDir?: string }) => {
    writeModel(join(cacheDir ?? '', MODEL), 'half');
    throw new Error('rede caiu');
  };
  await assert.rejects(downloadWhisperModel({ cache, load, hashes: hashesOf('half') }), /rede caiu/);
  assert.equal(existsSync(join(cache, WHISPER_MODEL)), false);
  assert.equal(whisperDownloaded(cache), false);
});

test("without a cache folder, transformers' own cache is checked (no throw: its package.json is not exported)", () => {
  assert.equal(typeof whisperDownloaded(), 'boolean');
});

test("transformers' progress events become download progress (file, bytes); other events are ignored", () => {
  assert.deepEqual(whisperProgressOf({ status: 'progress', file: 'onnx/encoder_model_quantized.onnx', loaded: 10, total: 40 }), {
    label: 'onnx/encoder_model_quantized.onnx', receivedBytes: 10, totalBytes: 40,
  });
  assert.equal(whisperProgressOf({ status: 'initiate', file: 'config.json' }), undefined);
  assert.equal(whisperProgressOf({ status: 'ready' }), undefined);
});

test('GIZZY_WHISPER_CACHE moves the Whisper cache out of the transformers package (read-only once installed)', async () => {
  const { whisperCacheOf } = await import('../../../src/infrastructure/alignment/whisperModel.ts');
  assert.equal(whisperCacheOf({ GIZZY_WHISPER_CACHE: '/home/x/.config/gizzycera/whisper' }), '/home/x/.config/gizzycera/whisper');
  assert.equal(whisperCacheOf({ GIZZY_WHISPER_CACHE: ' ' }), undefined);
  assert.equal(whisperCacheOf({}), undefined);
});

test('a Whisper that loaded but whose weights do not match the pinned hashes never reaches the cache', async () => {
  const cache = mkdtempSync(join(tmpdir(), 'gizzy-whisper-'));
  const load = async ({ cacheDir }: { cacheDir?: string }) => writeModel(join(cacheDir ?? '', MODEL), 'tampered');
  await assert.rejects(downloadWhisperModel({ cache, load, hashes: hashesOf('whole') }), /encoder_model_quantized\.onnx baixado não confere/);
  assert.equal(existsSync(join(cache, WHISPER_MODEL)), false);
  assert.equal(existsSync(join(cache, '.gizzy-partial')), false);
  assert.equal(whisperDownloaded(cache), false);
});

test('Whisper is loaded from one pinned commit (q8, on the CPU), in the given cache', () => {
  assert.match(WHISPER_REVISION, /^[0-9a-f]{40}$/);
  const options = recognizerOptions({ cacheDir: '/tmp/c' });
  assert.equal(options.revision, WHISPER_REVISION);
  assert.equal(options.dtype, 'q8');
  assert.equal(options.cache_dir, '/tmp/c');
  assert.equal('cache_dir' in recognizerOptions({ cacheDir: undefined }), false);
});
