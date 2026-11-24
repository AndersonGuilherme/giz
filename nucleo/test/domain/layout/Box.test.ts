import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Caixa } from '../../../src/dominio/layout/Caixa.ts';
import { Caixas } from '../../../src/dominio/layout/Caixas.ts';
import { Fonte } from '../../../src/dominio/layout/Fonte.ts';

const caixa = (rotulo: string, [x, y, largura = 100, altura = 100]: number[]) => Caixa.de(rotulo, { x, y, largura, altura });

test('caixas que só encostam não se sobrepõem', () => {
  assert.equal(caixa('a', [0, 0]).sobrepoe(caixa('b', [100, 0])), false);
  assert.equal(caixa('a', [0, 0]).sobrepoe(caixa('b', [99, 99])), true);
});
test('dentroDe aceita a borda e recusa o que passa dela', () => {
  const area = caixa('área', [0, 0, 200, 200]);
  assert.equal(caixa('a', [100, 100]).dentroDe(area), true);
  assert.equal(caixa('a', [101, 100]).dentroDe(area), false);
});
test('duas caixas sobrepostas são acusadas com os rótulos', () => {
  const caixas = Caixas.de([caixa('título', [0, 0]), caixa('legenda', [50, 50]), caixa('rodapé', [0, 500])]);
  const rotulos = caixas.sobreposicoes().map(([a, b]) => [a.rotulo, b.rotulo]);
  assert.deepEqual(rotulos, [['título', 'legenda']]);
});
test('foraDe lista as caixas que saem da área', () => {
  const caixas = Caixas.de([caixa('dentro', [10, 10]), caixa('fora', [150, 10])]);
  assert.deepEqual(caixas.foraDe(caixa('área', [0, 0, 200, 200])).map((c) => c.rotulo), ['fora']);
});
test('textosQueNaoCabem acusa a caixa cujo texto não encaixa', () => {
  const fonte = Fonte.de({ familia: 'texto', tamanho: 50, alturaDaLinha: 1.2, maximoDeLinhas: 1 });
  const curta = Caixa.comTexto('curta', { x: 0, y: 0, largura: 400, altura: 60 }, { texto: 'oi', fonte });
  const longa = Caixa.comTexto('longa', { x: 0, y: 100, largura: 400, altura: 60 }, { texto: 'palavra '.repeat(20), fonte });
  assert.deepEqual(Caixas.de([curta, longa]).textosQueNaoCabem().map((c) => c.rotulo), ['longa']);
});
