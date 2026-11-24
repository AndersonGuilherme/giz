import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Proporcao } from '../../../src/dominio/valores/Proporcao.ts';

test('Proporcao 9:16 é vertical 1080x1920', () => {
  const p = Proporcao.de('9:16');
  assert.deepEqual([p.largura(), p.altura(), p.vertical()], [1080, 1920, true]);
});
test('Proporcao recusa 4:3', () => assert.throws(() => Proporcao.de('4:3'), /proporção "4:3"/));
