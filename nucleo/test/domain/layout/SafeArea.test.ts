import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AreaSegura } from '../../../src/dominio/layout/AreaSegura.ts';
import { Proporcao } from '../../../src/dominio/valores/Proporcao.ts';

test('área segura 9:16 respeita a interface do Reels', () => {
  const a = AreaSegura.para(Proporcao.de('9:16'));
  assert.deepEqual([a.x, a.y, a.largura, a.altura], [86, 250, 908, 1248]);
});
test('área segura 16:9 deixa 5% de cada lado', () => {
  const a = AreaSegura.para(Proporcao.de('16:9'));
  assert.deepEqual([a.x, a.y, a.largura, a.altura], [96, 54, 1728, 972]);
});
