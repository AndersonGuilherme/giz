// Demo (falha de propósito): B recebe a peça pelo construtor. Dá pra passar um fake?
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderServiceB } from './quiz/b-recebe-concreto.ts';

test('B aceita um repositório falso', () => {
  const fake = { save: async () => 42 };
  assert.ok(new OrderServiceB(fake as never));
});
