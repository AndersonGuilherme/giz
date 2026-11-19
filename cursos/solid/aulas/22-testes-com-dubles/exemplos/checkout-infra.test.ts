// ANTES: os seis comportamentos do checkout testados passando pela infra (simulada, com latência).
import './test-env.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './domain/order-service.ts';
import { PostgresOrderRepository } from './infra/postgres-order-repository.ts';
import { SmtpNotifier } from './infra/smtp-notifier.ts';
import { MailProvider } from './infra/mail-provider.ts';

const repository = new PostgresOrderRepository();
const service = new OrderService(repository, new SmtpNotifier());
const tuesday = new Date('2026-11-17T12:00:00Z');
const blackFriday = new Date('2026-11-27T12:00:00Z');
const cart = (price: number) => ({ items: [{ price, quantity: 1 }], shippingMethod: 'standard' as const });
const ana = { email: 'ana@exemplo.com', kind: 'vip' as const };

test('pedido sem itens é recusado', async () => {
  await assert.rejects(service.checkout({ items: [], shippingMethod: 'standard' }, ana, tuesday), /Pedido sem itens/);
});
test('VIP ganha 10%', async () => {
  assert.equal((await service.checkout(cart(30000), ana, tuesday)).total, 27000);
});
test('Black Friday: vale o maior desconto', async () => {
  assert.equal((await service.checkout(cart(30000), ana, blackFriday)).total, 24000);
});
test('frete grátis pelo subtotal, antes do desconto', async () => {
  assert.equal((await service.checkout(cart(20000), ana, tuesday)).total, 18000);
});
test('grava o pedido com total e desconto', async () => {
  const { id } = await service.checkout(cart(30000), ana, tuesday);
  assert.deepEqual(await repository.findById(id), { email: 'ana@exemplo.com', total: 27000, discount: 3000 });
});
test('avisa o cliente com total e economia', async () => {
  await service.checkout(cart(30000), ana, tuesday);
  assert.equal(MailProvider.outbox.at(-1)?.body, 'Pedido confirmado! Total: R$ 270,00 (você economizou R$ 30,00)');
});
