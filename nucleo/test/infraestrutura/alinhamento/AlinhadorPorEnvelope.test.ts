import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Audio } from '../../../src/dominio/fala/Audio.ts';
import { Envelope } from '../../../src/dominio/fala/Envelope.ts';
import { Fps } from '../../../src/dominio/valores/Tempo.ts';
import { AlinhadorPorEnvelope } from '../../../src/infraestrutura/alinhamento/AlinhadorPorEnvelope.ts';

const TAXA = 24000;
const trecho = (segundos: number, amplitude: number) =>
  Array.from({ length: Math.round(segundos * TAXA) }, (_, i) => amplitude * Math.sin((2 * Math.PI * 220 * i) / TAXA));
const audio = (...partes: number[][]) => Audio.de(Float32Array.from(partes.flat()), TAXA);

test('por envelope: palavras em ordem e dentro da duração', async () => {
  const som = audio(trecho(0.3, 0), trecho(1.2, 0.5), trecho(0.3, 0));
  const palavras = await new AlinhadorPorEnvelope().alinhar(som, 'Olá, eu sou a Ana!');
  const json = palavras.paraJson();
  assert.deepEqual(json.map((p) => p.texto), ['Olá,', 'eu', 'sou', 'a', 'Ana!']);
  json.forEach((p, i) => {
    assert.ok(p.fim >= p.inicio);
    assert.ok(p.inicio >= (json[i - 1]?.fim ?? 0));
    assert.ok(p.fim <= som.duracao().valor());
  });
});

test('por envelope: as palavras ficam nos quadros com voz', async () => {
  const som = audio(trecho(0.5, 0), trecho(1, 0.5), trecho(0.5, 0));
  const json = (await new AlinhadorPorEnvelope().alinhar(som, 'um dois três')).paraJson();
  const comVoz = Envelope.medir(som, Fps.PADRAO).quadrosComVoz();
  const primeiro = comVoz.indexOf(true) / 30;
  const ultimo = (comVoz.lastIndexOf(true) + 1) / 30;
  assert.ok(json[0]!.inicio >= primeiro - 1e-9, `começa em ${json[0]!.inicio}, voz em ${primeiro}`);
  assert.ok(json.at(-1)!.fim <= ultimo + 1e-9, `termina em ${json.at(-1)!.fim}, voz até ${ultimo}`);
});

test('por envelope: palavra mais longa ocupa mais tempo', async () => {
  const som = audio(trecho(2, 0.5));
  const [curta, longa] = (await new AlinhadorPorEnvelope().alinhar(som, 'a paralelepípedo')).paraJson();
  assert.ok(longa!.fim - longa!.inicio > 5 * (curta!.fim - curta!.inicio));
});

test('por envelope: áudio sem voz espalha pela duração inteira', async () => {
  const som = audio(trecho(1, 0));
  const json = (await new AlinhadorPorEnvelope().alinhar(som, 'um dois')).paraJson();
  assert.equal(json[0]!.inicio, 0);
  assert.ok(json[1]!.inicio > 0 && json[1]!.fim <= 1);
});
