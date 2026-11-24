import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/dominio/fala/Audio.ts';
import { Envelope } from '../../../src/dominio/fala/Envelope.ts';
import { Fps, Quadro } from '../../../src/dominio/valores/Tempo.ts';

const TAXA = 24000;
const trecho = (segundos: number, amplitude: number) =>
  Array.from({ length: Math.round(segundos * TAXA) }, (_, i) => amplitude * Math.sin((2 * Math.PI * 220 * i) / TAXA));
const audio = (...partes: number[][]) => Audio.de(Float32Array.from(partes.flat()), TAXA);

test('um valor por quadro, arredondando a duração para cima', () => {
  const envelope = Envelope.medir(audio(trecho(1.01, 0.5)), Fps.PADRAO);
  assert.equal(envelope.paraJson().length, 31);
});

test('silêncio é 0 e a voz forte chega perto de 1', () => {
  const envelope = Envelope.medir(audio(trecho(0.5, 0), trecho(0.5, 0.5), trecho(0.5, 0)), Fps.PADRAO);
  assert.equal(envelope.abertura(Quadro.de(0)), 0);
  assert.ok(envelope.abertura(Quadro.de(22)) >= 0.95);
  assert.equal(envelope.abertura(Quadro.de(44)), 0);
});

test('a abertura fica entre 0 e 1 e é 0 fora do áudio', () => {
  const envelope = Envelope.medir(audio(trecho(0.3, 0.2), trecho(0.3, 0.6)), Fps.PADRAO);
  envelope.paraJson().forEach((valor) => assert.ok(valor >= 0 && valor <= 1));
  assert.equal(envelope.abertura(Quadro.de(1000)), 0);
});

test('quadros com voz são os de abertura maior que 0; voz bem baixa conta como silêncio', () => {
  const envelope = Envelope.medir(audio(trecho(0.2, 0.01), trecho(0.2, 0.5)), Fps.PADRAO);
  const comVoz = envelope.quadrosComVoz();
  assert.equal(comVoz.length, 12);
  assert.deepEqual(comVoz.slice(0, 4), [false, false, false, false]);
  assert.deepEqual(comVoz.slice(8), [true, true, true, true]);
});

test('paraJson devolve uma cópia', () => {
  const envelope = Envelope.medir(audio(trecho(0.2, 0.5)), Fps.PADRAO);
  envelope.paraJson().fill(9);
  assert.ok(envelope.paraJson().every((valor) => valor <= 1));
});
