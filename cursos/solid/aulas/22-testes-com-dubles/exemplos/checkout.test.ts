// DEPOIS: os mesmos seis comportamentos, com dublês no lugar da infra.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './domain/order-service.ts';
import { dummyRepository, dummyNotifier, stubRepository, stubNotifier, InMemoryOrderRepository } from './doubles.ts';
import { SpyNotifier, MockNotifier } from './doubles-calls.ts';

const tuesday = new Date('2026-11-17T12:00:00Z');
const blackFriday = new Date('2026-11-27T12:00:00Z');
const cart = (price: number) => ({ items: [{ price, quantity: 1 }], shippingMethod: 'standard' as const });
const ana = { email: 'ana@exemplo.com', kind: 'vip' as const };

test('pedido sem itens é recusado', async () => {
  const service = new OrderService(dummyRepository, dummyNotifier);
  await assert.rejects(service.checkout({ items: [], shippingMethod: 'standard' }, ana, tuesday), /Pedido sem itens/);
});
test('VIP ganha 10%', async () => {
  const mock = new MockNotifier('ana@exemplo.com', 27000, 3000);
  const { id, total } = await new OrderService(stubRepository(7), mock).checkout(cart(30000), ana, tuesday);
  assert.deepEqual([id, total], [7, 27000]);
  mock.verify();
});
test('Black Friday: vale o maior desconto', async () => {
  const service = new OrderService(stubRepository(1), stubNotifier);
  assert.equal((await service.checkout(cart(30000), ana, blackFriday)).total, 24000);
});
test('frete grátis pelo subtotal, antes do desconto', async () => {
  const service = new OrderService(stubRepository(1), stubNotifier);
  assert.equal((await service.checkout(cart(20000), ana, tuesday)).total, 18000);
});
test('grava o pedido com total e desconto', async () => {
  const repository = new InMemoryOrderRepository();
  const { id } = await new OrderService(repository, stubNotifier).checkout(cart(30000), ana, tuesday);
  assert.deepEqual(await repository.findById(id), { email: 'ana@exemplo.com', total: 27000, discount: 3000 });
});
test('avisa o cliente com total e economia', async () => {
  const spy = new SpyNotifier();
  await new OrderService(stubRepository(1), spy).checkout(cart(30000), ana, tuesday);
  assert.deepEqual(spy.calls, [['ana@exemplo.com', 27000, 3000]]);
});
