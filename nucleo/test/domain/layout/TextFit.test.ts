import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EncaixeDeTexto } from '../../../src/dominio/layout/EncaixeDeTexto.ts';
import { Fonte } from '../../../src/dominio/layout/Fonte.ts';
import { FONTE_LEGENDA } from '../../../src/dominio/layout/layoutsDeAula.ts';
import { AreaSegura } from '../../../src/dominio/layout/AreaSegura.ts';
import { Proporcao } from '../../../src/dominio/valores/Proporcao.ts';

const semEspacos = (linhas: readonly string[]) => linhas.join('').replace(/\s+/g, '');

test('texto curto fica no tamanho base em uma linha', () => {
  const r = EncaixeDeTexto.medir('Oi, eu sou a Ana.', FONTE_LEGENDA, 908);
  assert.deepEqual(r, { linhas: ['Oi, eu sou a Ana.'], tamanho: FONTE_LEGENDA.tamanhoBase(), cabe: true });
});
test('fala de 300 caracteres na legenda 9:16 encolhe e cabe', () => {
  const r = EncaixeDeTexto.medir('x '.repeat(150), FONTE_LEGENDA, 908);
  assert.ok(r.cabe);
  assert.ok(r.tamanho < FONTE_LEGENDA.tamanhoBase());
  assert.ok(r.tamanho >= FONTE_LEGENDA.tamanhoBase() * 0.6);
  assert.equal(semEspacos(r.linhas), 'x'.repeat(150));
});
test('palavra maior que a linha é quebrada, sem perder caracteres', () => {
  const fonte = Fonte.de({ familia: 'texto', tamanho: 100, alturaDaLinha: 1, maximoDeLinhas: 1 });
  const r = EncaixeDeTexto.medir('A'.repeat(80), fonte, 908);
  assert.equal(r.cabe, false);
  assert.equal(r.tamanho, 60);
  assert.ok(r.linhas.length > 1);
  assert.equal(semEspacos(r.linhas), 'A'.repeat(80));
});
test('código de 20 linhas em 9:16 cabe ou acusa erro, nunca passa calado', () => {
  const codigo = Array.from({ length: 20 }, (_, i) => `  const valor${i} = calcular(entrada, ${i}); // passo ${i}`).join('\n');
  const mono = Fonte.de({ familia: 'mono', tamanho: 34, alturaDaLinha: 1.4, maximoDeLinhas: 24 });
  const largura = AreaSegura.para(Proporcao.VERTICAL).largura;
  const r = EncaixeDeTexto.medir(codigo, mono, largura);
  const porLinha = Math.floor(largura / (r.tamanho * 0.6));
  const transborda = r.linhas.length > mono.maximoDeLinhas() || r.linhas.some((l) => l.length > porLinha);
  assert.equal(r.cabe, !transborda);
  assert.ok(r.linhas.length >= 20, 'cada linha de código vira pelo menos uma linha');
  assert.equal(semEspacos(r.linhas), codigo.replace(/\s+/g, ''));
  const apertada = Fonte.de({ familia: 'mono', tamanho: 34, alturaDaLinha: 1.4, maximoDeLinhas: 12 });
  assert.equal(EncaixeDeTexto.medir(codigo, apertada, largura).cabe, false, '20 linhas em 12 acusam erro');
});
test('Fonte recusa tamanho não positivo', () => {
  assert.throws(() => Fonte.de({ familia: 'texto', tamanho: 0, alturaDaLinha: 1, maximoDeLinhas: 1 }), /fonte/);
});
