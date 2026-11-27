import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadWhisperModel, whisperDownloaded } from '../../../src/infrastructure/alignment/whisperDownload.ts';
import { WHISPER_MODEL, whisperProgressOf } from '../../../src/infrastructure/alignment/whisperModel.ts';

const FILES = ['config.json', 'onnx/encoder_model_quantized.onnx', 'onnx/decoder_model_merged_quantized.onnx'];

function writeModel(folder: string, content = 'x'): void {
  mkdirSync(join(folder, 'onnx'), { recursive: true });
  FILES.forEach((file) => writeFileSync(join(folder, file), content));
}

test('Whisper counts as downloaded only with its files AND the done marker (files left by a stopped download are not)', () => {
  const cache = mkdtempSync(join(tmpdir(), 'giz-whisper-'));
  assert.equal(whisperDownloaded(cache), false);
  writeModel(join(cache, WHISPER_MODEL));
  assert.equal(whisperDownloaded(cache), false);
  writeFileSync(join(cache, WHISPER_MODEL, '.giz-complete'), 'x');
  assert.equal(whisperDownloaded(cache), true);
});

test('the download goes to a partial folder and only a model that loaded moves into the cache, replacing a broken one', async () => {
  const cache = mkdtempSync(join(tmpdir(), 'giz-whisper-'));
  writeModel(join(cache, WHISPER_MODEL), 'broken');
  const seen: string[] = [];
  const load = async ({ cacheDir }: { cacheDir?: string }) => {
    seen.push(cacheDir ?? '');
    writeModel(join(cacheDir ?? '', WHISPER_MODEL), 'whole');
  };
  await downloadWhisperModel({ cache, load });
  assert.deepEqual(seen, [join(cache, '.giz-partial')]);
  assert.equal(readFileSync(join(cache, WHISPER_MODEL, 'config.json'), 'utf8'), 'whole');
  assert.equal(whisperDownloaded(cache), true);
  assert.equal(existsSync(join(cache, '.giz-partial')), false);
});

test('a download that fails (or is stopped) leaves the cache as it was: no marker, nothing moved', async () => {
  const cache = mkdtempSync(join(tmpdir(), 'giz-whisper-'));
  const load = async ({ cacheDir }: { cacheDir?: string }) => {
    writeModel(join(cacheDir ?? '', WHISPER_MODEL), 'half');
    throw new Error('rede caiu');
  };
  await assert.rejects(downloadWhisperModel({ cache, load }), /rede caiu/);
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

test('GIZ_WHISPER_CACHE moves the Whisper cache out of the transformers package (read-only once installed)', async () => {
  const { whisperCacheOf } = await import('../../../src/infrastructure/alignment/whisperModel.ts');
  assert.equal(whisperCacheOf({ GIZ_WHISPER_CACHE: '/home/x/.config/giz-estudio/whisper' }), '/home/x/.config/giz-estudio/whisper');
  assert.equal(whisperCacheOf({ GIZ_WHISPER_CACHE: ' ' }), undefined);
  assert.equal(whisperCacheOf({}), undefined);
});
