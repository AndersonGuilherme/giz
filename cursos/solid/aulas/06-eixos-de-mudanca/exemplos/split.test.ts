import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetInfra, db, mailer } from './infra.ts';
import { OrderService } from './order-service.split.ts';
import { PriceCalculator } from './price-calculator.ts';
import { vip, normalDay, order } from './fixtures.ts';

beforeEach(resetInfra);

test('e-mail mostra a economia em reais redondos', () => {
  new OrderService().checkout(order, vip, normalDay);
  assert.match(mailer.outbox[0].body, /economizou R\$\s21\)$/);
});

test('VIP continua pagando R$ 188,82', () => {
  assert.equal(new OrderService().checkout(order, vip, normalDay).total, 18882);
  assert.equal(db.rows[0].data.total, 18882);
});

test('o preço não sabe que e-mail existe', () => {
  assert.deepEqual(new PriceCalculator().quote(order.items, vip, normalDay), { subtotal: 20980, discount: 2098 });
  assert.equal(mailer.outbox.length, 0);
});
