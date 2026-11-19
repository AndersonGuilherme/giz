// C e D invertem a seta: carregam sem banco configurado. (A e B, não: veja b-injecao.demo.ts.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderServiceC } from './quiz/c-recebe-porta.ts';
import { OrderServiceD } from './quiz/d-busca-porta.ts';
import { registry } from './domain/registry.ts';

const fake = { save: async () => 42 };

test('C: recebe a porta, aceita um fake sem banco', async () => {
  assert.equal(await new OrderServiceC(fake).repository.save({ email: 'a@b.c', total: 1, discount: 0 }), 42);
});
test('D: inverte sem injeção, mas só funciona se alguém lembrar de registrar', () => {
  assert.throws(() => new OrderServiceD().repository, /nada registrado como "orders"/);
  registry.put('orders', fake);
  assert.equal(new OrderServiceD().repository, fake);
});
