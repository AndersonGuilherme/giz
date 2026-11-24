import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroDeDominio } from '../../../src/dominio/ErroDeDominio.ts';
import { Palavras } from '../../../src/dominio/fala/Palavras.ts';
import { Segundos } from '../../../src/dominio/valores/Tempo.ts';

const s = (...valores: number[]) => valores.map((valor) => Segundos.de(valor));

test('doTexto separa por espaço e mantém a pontuação junto da palavra', () => {
  const palavras = Palavras.doTexto('  Olá,   Téo!  Tudo bem? ');
  assert.deepEqual(palavras.textos(), ['Olá,', 'Téo!', 'Tudo', 'bem?']);
});

test('comTempos grava início e fim de cada palavra', () => {
  const palavras = Palavras.doTexto('um dois').comTempos(s(0, 0.4), s(0.3, 0.9));
  assert.deepEqual(palavras.paraJson(), [
    { texto: 'um', inicio: 0, fim: 0.3 },
    { texto: 'dois', inicio: 0.4, fim: 0.9 },
  ]);
});

test('comTempos recusa quantidade diferente de tempos e fim antes do início', () => {
  const palavras = Palavras.doTexto('um dois');
  assert.throws(() => palavras.comTempos(s(0), s(0.3)), ErroDeDominio);
  assert.throws(() => palavras.comTempos(s(0, 0.5), s(0.3, 0.4)), ErroDeDominio);
});

test('ativaEm devolve a última palavra já começada (-1 antes da primeira)', () => {
  const palavras = Palavras.doTexto('um dois três').comTempos(s(0.1, 0.4, 0.8), s(0.3, 0.7, 1));
  assert.equal(palavras.ativaEm(Segundos.de(0)), -1);
  assert.equal(palavras.ativaEm(Segundos.de(0.1)), 0);
  assert.equal(palavras.ativaEm(Segundos.de(0.35)), 0);
  assert.equal(palavras.ativaEm(Segundos.de(0.5)), 1);
  assert.equal(palavras.ativaEm(Segundos.de(5)), 2);
});

test('paraJson devolve uma cópia', () => {
  const palavras = Palavras.doTexto('um');
  palavras.paraJson()[0]!.texto = 'mudou';
  assert.deepEqual(palavras.textos(), ['um']);
});
