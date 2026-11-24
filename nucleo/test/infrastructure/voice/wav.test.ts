import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/domain/speech/Audio.ts';
import { fromWav, toWav } from '../../../src/infrastructure/voice/wav.ts';

test('wav writes and reads back the same duration', () => {
  const samples = Float32Array.from({ length: 36000 }, (_, i) => 0.5 * Math.sin(i / 10));
  const wav = toWav(Audio.of(samples, 24000));
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt16LE(34), 16);
  const loaded = fromWav(wav);
  assert.equal(loaded.duration().value(), 1.5);
  assert.equal(loaded.rate(), 24000);
  assert.ok(Math.abs(loaded.samples()[100]! - samples[100]!) < 1 / 16000);
});

test('a stereo wav becomes mono by averaging the channels', () => {
  const wav = Buffer.alloc(44 + 8);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + 8, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(44100 * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(8, 40);
  wav.writeInt16LE(16384, 44); wav.writeInt16LE(0, 46); wav.writeInt16LE(-16384, 48); wav.writeInt16LE(-16384, 50);
  const loaded = fromWav(wav);
  assert.equal(loaded.rate(), 44100);
  assert.equal(loaded.samples().length, 2);
  assert.ok(Math.abs(loaded.samples()[0]! - 0.25) < 1e-3);
  assert.ok(Math.abs(loaded.samples()[1]! + 0.5) < 1e-3);
});

test('a wav that is not 16-bit PCM is rejected with a clear message', () => {
  const wav = toWav(Audio.of(new Float32Array(10), 24000));
  wav.writeUInt16LE(24, 34);
  assert.throws(() => fromWav(wav), /16 bits/);
  assert.throws(() => fromWav(Buffer.from('nada disso')), /WAV/);
});
