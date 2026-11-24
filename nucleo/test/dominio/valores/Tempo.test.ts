import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Fps, Quadro, Segundos } from '../../../src/dominio/valores/Tempo.ts';

test('1,5 s a 30 fps são 45 quadros; 1,51 s arredonda para 46', () => {
  assert.equal(Segundos.de(1.5).emQuadros(Fps.PADRAO).valor(), 45);
  assert.equal(Segundos.de(1.51).emQuadros(Fps.PADRAO).valor(), 46);
});
test('Quadro nunca fica negativo', () => assert.equal(Quadro.de(3).menos(Quadro.de(5)).valor(), 0));
test('Quadro recusa fração e negativo', () => {
  assert.throws(() => Quadro.de(1.5));
  assert.throws(() => Quadro.de(-1));
});
test('Segundos soma e recusa negativo', () => {
  assert.equal(Segundos.de(1).mais(Segundos.de(0.5)).valor(), 1.5);
  assert.throws(() => Segundos.de(-1), /segundos/);
});
test('Quadro soma e compara', () => {
  assert.equal(Quadro.de(2).mais(Quadro.de(3)).valor(), 5);
  assert.ok(Quadro.de(2).antesDe(Quadro.de(3)));
  assert.ok(!Quadro.de(3).antesDe(Quadro.de(3)));
});
test('Fps padrão é 30', () => assert.equal(Fps.PADRAO.valor(), 30));
