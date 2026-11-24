import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PalavraJson } from '../../../src/dominio/fala/PalavraJson.ts';
import { Palavras } from '../../../src/dominio/fala/Palavras.ts';
import { reconciliar } from '../../../src/dominio/fala/Reconciliacao.ts';
import { Segundos } from '../../../src/dominio/valores/Tempo.ts';

const w = (texto: string, inicio: number, fim: number): PalavraJson => ({ texto, inicio, fim });
const textos = (palavras: Palavras) => palavras.paraJson().map((p) => p.texto);

function assertCrescente(palavras: Palavras) {
  const json = palavras.paraJson();
  json.forEach((p, i) => {
    assert.ok(p.fim >= p.inicio, `"${p.texto}" termina (${p.fim}) antes de começar (${p.inicio})`);
    const anterior = json[i - 1];
    if (anterior) assert.ok(p.inicio >= anterior.fim, `"${p.texto}" (${p.inicio}) começa antes do fim de "${anterior.texto}" (${anterior.fim})`);
  });
}

const tempoDe = (palavras: Palavras, texto: string) => palavras.paraJson().find((p) => p.texto === texto)!;

test('reconcilia quando o Whisper junta duas palavras', () => {
  const r = reconciliar(Palavras.doTexto('fiz o pull request ontem'),
    [w('fiz', 0, .2), w('o', .2, .3), w('pullrequest', .3, .9), w('ontem', .9, 1.3)])!;
  assert.deepEqual(r.paraJson().map((p) => p.texto), ['fiz', 'o', 'pull', 'request', 'ontem']);
  assertCrescente(r);
  assert.equal(tempoDe(r, 'pull').inicio, 0.3);
  assert.equal(tempoDe(r, 'request').fim, 0.9);
});

test('mantém o texto do roteiro, não o que foi ouvido', () => {
  const r = reconciliar(Palavras.doTexto('Olá, Téo!'), [w('ola', 0, .3), w('teu', .3, .6)])!;
  assert.deepEqual(r.paraJson().map((p) => p.texto), ['Olá,', 'Téo!']);
  assert.deepEqual(r.paraJson()[1], { texto: 'Téo!', inicio: 0.3, fim: 0.6 });
});

test('alinhamento ruim demais devolve null', () => assert.equal(reconciliar(Palavras.doTexto('um dois três quatro cinco'), [w('banana', 0, 1)]), null));

test('reconcilia quando o Whisper separa uma palavra em duas', () => {
  const r = reconciliar(Palavras.doTexto('o microsserviço caiu'),
    [w(' o', 0, .1), w(' micro', .1, .5), w(' serviço', .5, 1), w(' caiu.', 1, 1.4)])!;
  assert.deepEqual(textos(r), ['o', 'microsserviço', 'caiu']);
  assert.deepEqual(tempoDe(r, 'microsserviço'), { texto: 'microsserviço', inicio: 0.1, fim: 1 });
  assertCrescente(r);
});

test('inglês dentro de fala em pt-BR: "deploy" ouvido como "deplói" não perde a ordem', () => {
  const r = reconciliar(Palavras.doTexto('fiz o deploy ontem'),
    [w(' Fiz', 0, .2), w(' o', .2, .3), w(' deplói', .3, .8), w(' ontem.', .8, 1.2)])!;
  assert.deepEqual(textos(r), ['fiz', 'o', 'deploy', 'ontem']);
  assert.deepEqual(tempoDe(r, 'deploy'), { texto: 'deploy', inicio: 0.3, fim: 0.8 });
  assertCrescente(r);
});

test('inglês dentro de fala em pt-BR: "deploy" ouvido como "the ploy" não perde a ordem', () => {
  const r = reconciliar(Palavras.doTexto('fiz o deploy ontem'),
    [w(' Fiz', 0, .2), w(' o', .2, .3), w(' the', .3, .45), w(' ploy', .45, .8), w(' ontem.', .8, 1.2)])!;
  assert.deepEqual(textos(r), ['fiz', 'o', 'deploy', 'ontem']);
  assert.deepEqual(tempoDe(r, 'deploy'), { texto: 'deploy', inicio: 0.3, fim: 0.8 });
  assertCrescente(r);
});

test('palavra do roteiro sem par ganha o tempo entre as vizinhas', () => {
  const r = reconciliar(Palavras.doTexto('hoje vamos aprender juntos'),
    [w(' vamos', .4, .6), w(' aprender', .6, 1), w(' juntos.', 1, 1.4)])!;
  assert.deepEqual(tempoDe(r, 'hoje'), { texto: 'hoje', inicio: 0, fim: 0.4 });
  assertCrescente(r);
});

test('palavras sem par no meio e no fim ficam em ordem', () => {
  const r = reconciliar(Palavras.doTexto('um dois três quatro cinco'),
    [w('um', 0, .2), w('xyz', .2, .4), w('três', .5, .7), w('quatro', .7, 1)])!;
  assert.ok(tempoDe(r, 'dois').inicio >= 0.2 && tempoDe(r, 'dois').fim <= 0.5);
  assert.equal(tempoDe(r, 'cinco').inicio, 1);
  assertCrescente(r);
});

test('tempos fora de ordem do Whisper saem em ordem crescente', () => {
  const r = reconciliar(Palavras.doTexto('um dois três'), [w('um', 0, .5), w('dois', .4, .3), w('três', .6, 1)])!;
  assertCrescente(r);
});

test('pontuação solta ouvida é ignorada', () => {
  const r = reconciliar(Palavras.doTexto('Oi, Ana'), [w(' Oi', 0, .2), w(',', .2, .2), w(' Ana.', .3, .7)])!;
  assert.deepEqual(r.paraJson(), [{ texto: 'Oi,', inicio: 0, fim: 0.2 }, { texto: 'Ana', inicio: 0.3, fim: 0.7 }]);
});

test('roteiro sem palavras ouvidas devolve null', () => assert.equal(reconciliar(Palavras.doTexto('um dois'), []), null));

test('palavra que o Whisper não ouviu não rouba o tempo da vizinha', () => {
  const r = reconciliar(Palavras.doTexto('eu sou a Ana'), [w(' sou', .3, .6), w(' a', .6, .7), w(' Ana.', .7, 1.1)])!;
  assert.deepEqual(r.paraJson(), [
    { texto: 'eu', inicio: 0, fim: 0.3 }, { texto: 'sou', inicio: 0.3, fim: 0.6 },
    { texto: 'a', inicio: 0.6, fim: 0.7 }, { texto: 'Ana', inicio: 0.7, fim: 1.1 },
  ]);
});

test('tempo ouvido além do fim do áudio é limitado à duração', () => {
  const r = reconciliar(Palavras.doTexto('um dois'), [w('um', 0, 5), w('dois', 6, 7)], Segundos.de(1))!;
  r.paraJson().forEach((p) => assert.ok(p.inicio <= 1 && p.fim <= 1, JSON.stringify(p)));
  assertCrescente(r);
});

test('palavras sem par depois da última ouvida vão até o fim do áudio, sem ficar com duração zero', () => {
  const r = reconciliar(Palavras.doTexto('um dois três quatro cinco'),
    [w('um', 0, .2), w('dois', .2, .4), w('três', .4, .6)], Segundos.de(2))!;
  for (const texto of ['quatro', 'cinco']) {
    const p = tempoDe(r, texto);
    assert.ok(p.fim > p.inicio, `"${texto}" com duração zero: ${JSON.stringify(p)}`);
    assert.ok(p.fim <= 2);
  }
  assert.equal(tempoDe(r, 'quatro').inicio, 0.6);
  assert.equal(tempoDe(r, 'cinco').fim, 2);
  assertCrescente(r);
});
