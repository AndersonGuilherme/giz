// Mostrado na tela: código feito para Rectangle recebe um Square. Falha de propósito.
// Rodar: node --test rectangle.demo.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Square, stretch } from './rectangle.ts';

test('esticar para 5 × 4 dá área 20', () => {
  assert.equal(stretch(new Square()), 20);
});
