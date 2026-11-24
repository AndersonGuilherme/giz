import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/dominio/fala/Audio.ts';
import { ErroDeDominio } from '../../../src/dominio/ErroDeDominio.ts';

const TAXA = 24000;
const constante = (segundos: number, valor: number) => Array.from({ length: Math.round(segundos * TAXA) }, () => valor);

test('a duração é o número de amostras dividido pela taxa', () => {
  assert.equal(Audio.de(new Float32Array(36000), TAXA).duracao().valor(), 1.5);
});

test('taxa inválida é recusada', () => {
  assert.throws(() => Audio.de(new Float32Array(10), 0), ErroDeDominio);
});

test('aparado corta o silêncio das pontas e mantém 0,04 s de cada lado', () => {
  const audio = Audio.de(Float32Array.from([...constante(0.5, 0), ...constante(1, 0.3), ...constante(0.5, 0.005)]), TAXA);
  const aparado = audio.aparado();
  assert.ok(Math.abs(aparado.duracao().valor() - 1.08) < 1 / TAXA * 2, `duração ${aparado.duracao().valor()}`);
});

test('aparado não passa das pontas quando não há silêncio', () => {
  const audio = Audio.de(Float32Array.from(constante(1, 0.3)), TAXA);
  assert.equal(audio.aparado().duracao().valor(), 1);
});

test('normalizado leva o volume ao alvo sem estourar o pico', () => {
  const baixo = Audio.de(Float32Array.from(constante(1, 0.02)), TAXA).normalizado();
  assert.ok(Math.abs(baixo.amostras()[0]! - 0.085) < 1e-6);
  const pico = Audio.de(Float32Array.from([...constante(1, 0.02), 0.5]), TAXA).normalizado();
  assert.ok(Math.max(...pico.amostras()) <= 0.95 + 1e-6);
});
