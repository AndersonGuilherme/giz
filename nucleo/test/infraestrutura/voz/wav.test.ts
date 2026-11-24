import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/dominio/fala/Audio.ts';
import { deWav, paraWav } from '../../../src/infraestrutura/voz/wav.ts';

test('wav escreve e lê de volta a mesma duração', () => {
  const amostras = Float32Array.from({ length: 36000 }, (_, i) => 0.5 * Math.sin(i / 10));
  const wav = paraWav(Audio.de(amostras, 24000));
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt16LE(34), 16);
  const lido = deWav(wav);
  assert.equal(lido.duracao().valor(), 1.5);
  assert.equal(lido.taxa(), 24000);
  assert.ok(Math.abs(lido.amostras()[100]! - amostras[100]!) < 1 / 16000);
});

test('wav estéreo vira mono pela média dos canais', () => {
  const wav = Buffer.alloc(44 + 8);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + 8, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(44100 * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(8, 40);
  wav.writeInt16LE(16384, 44); wav.writeInt16LE(0, 46); wav.writeInt16LE(-16384, 48); wav.writeInt16LE(-16384, 50);
  const lido = deWav(wav);
  assert.equal(lido.taxa(), 44100);
  assert.equal(lido.amostras().length, 2);
  assert.ok(Math.abs(lido.amostras()[0]! - 0.25) < 1e-3);
  assert.ok(Math.abs(lido.amostras()[1]! + 0.5) < 1e-3);
});

test('wav que não é PCM de 16 bits é recusado com mensagem clara', () => {
  const wav = paraWav(Audio.de(new Float32Array(10), 24000));
  wav.writeUInt16LE(24, 34);
  assert.throws(() => deWav(wav), /16 bits/);
  assert.throws(() => deWav(Buffer.from('nada disso')), /WAV/);
});
