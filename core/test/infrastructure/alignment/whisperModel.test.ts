import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WHISPER_MODEL, whisperDownloaded, whisperProgressOf } from '../../../src/infrastructure/alignment/whisperModel.ts';

test('Whisper counts as downloaded only when its config and both quantized networks are in the cache', () => {
  const cache = mkdtempSync(join(tmpdir(), 'giz-whisper-'));
  assert.equal(whisperDownloaded(cache), false);
  const folder = join(cache, WHISPER_MODEL);
  mkdirSync(join(folder, 'onnx'), { recursive: true });
  writeFileSync(join(folder, 'config.json'), '{}');
  writeFileSync(join(folder, 'onnx', 'encoder_model_quantized.onnx'), 'x');
  assert.equal(whisperDownloaded(cache), false);
  writeFileSync(join(folder, 'onnx', 'decoder_model_merged_quantized.onnx'), 'x');
  assert.equal(whisperDownloaded(cache), true);
});

test("transformers' progress events become download progress (file, bytes); other events are ignored", () => {
  assert.deepEqual(whisperProgressOf({ status: 'progress', file: 'onnx/encoder_model_quantized.onnx', loaded: 10, total: 40 }), {
    label: 'onnx/encoder_model_quantized.onnx', receivedBytes: 10, totalBytes: 40,
  });
  assert.equal(whisperProgressOf({ status: 'initiate', file: 'config.json' }), undefined);
  assert.equal(whisperProgressOf({ status: 'ready' }), undefined);
});

test("without a cache folder, transformers' own cache is checked (no throw: its package.json is not exported)", () => {
  assert.equal(typeof whisperDownloaded(), 'boolean');
});
