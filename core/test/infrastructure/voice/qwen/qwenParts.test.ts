import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BpeTokenizer } from '../../../../src/infrastructure/voice/qwen/BpeTokenizer.ts';
import { readNpy } from '../../../../src/infrastructure/voice/qwen/npy.ts';
import { sampleToken, seededRandom } from '../../../../src/infrastructure/voice/qwen/sampling.ts';
import { linear, linearSilu, sum } from '../../../../src/infrastructure/voice/qwen/vectors.ts';

function npy(values: number[], shape: number[]): Buffer {
  const header = `{'descr': '<f4', 'fortran_order': False, 'shape': (${shape.join(', ')}${shape.length === 1 ? ',' : ''}), }`;
  const padded = header.padEnd(118, ' ') + '\n';
  const prefix = Buffer.from([0x93, ...Buffer.from('NUMPY'), 1, 0]);
  const length = Buffer.alloc(2);
  length.writeUInt16LE(padded.length);
  return Buffer.concat([prefix, length, Buffer.from(padded, 'latin1'), Buffer.from(Float32Array.from(values).buffer)]);
}

test('a float32 .npy file: data and shape', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'giz-npy-')), 'a.npy');
  writeFileSync(path, npy([1, 2, 3, 4, 5, 6], [2, 3]));
  const array = readNpy(path);
  assert.deepEqual(array.shape, [2, 3]);
  assert.deepEqual([...array.data], [1, 2, 3, 4, 5, 6]);
});

test('the tokenizer: special tokens as one id, BPE merges by rank, bytes mapped as GPT-2 (space is Ġ)', () => {
  const folder = mkdtempSync(join(tmpdir(), 'giz-bpe-'));
  writeFileSync(join(folder, 'vocab.json'), JSON.stringify({ o: 0, i: 1, oi: 2, 'Ġ': 3, a: 4, 'Ġa': 5, '!': 6 }));
  writeFileSync(join(folder, 'merges.txt'), '#version: 0.2\no i\nĠ a\n');
  const tokenizer = new BpeTokenizer(folder);
  assert.deepEqual(tokenizer.encode('oi a!'), [2, 5, 6]);
  assert.deepEqual(tokenizer.encode('<|im_start|>oi<|im_end|>'), [151644, 2, 151645]);
  assert.throws(() => tokenizer.encode('x'), /fora do vocabulário/);
});

test('seeded random numbers repeat with the same seed', () => {
  const first = seededRandom(7);
  const second = seededRandom(7);
  const draws = [first(), first(), first()];
  assert.deepEqual(draws, [second(), second(), second()]);
  draws.forEach((draw) => assert.ok(draw >= 0 && draw < 1));
  assert.notEqual(seededRandom(8)(), draws[0]);
});

test('sampling: temperature 0 takes the best; top-k never picks outside the k best; -Infinity is never picked', () => {
  const logits = Float32Array.from([0.1, 5, -Infinity, 4.9, 0.2]);
  assert.equal(sampleToken(logits, { temperature: 0, topK: 50, random: () => 0.5 }), 1);
  const random = seededRandom(3);
  const picked = new Set(Array.from({ length: 200 }, () => sampleToken(logits, { temperature: 1, topK: 2, random })));
  assert.deepEqual([...picked].sort(), [1, 3]);
});

test('vector math: linear layer, silu activation and sums', () => {
  const layer = { weights: Float32Array.from([1, 2, 3, 4]), bias: Float32Array.from([0.5, -1]), outputs: 2 };
  assert.deepEqual([...linear(layer, [1, 1])], [3.5, 6]);
  const activated = linearSilu(layer, [1, 1]);
  assert.ok(Math.abs(activated[0] - 3.5 / (1 + Math.exp(-3.5))) < 1e-6);
  assert.deepEqual([...sum([1, 2], [3, 4], [5, 6])], [9, 12]);
});
