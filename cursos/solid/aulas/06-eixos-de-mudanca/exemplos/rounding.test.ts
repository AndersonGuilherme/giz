import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetInfra, db, mailer } from './infra.ts';
import { OrderService as Before } from './order-service.ts';
import { OrderService as Changed } from './order-service.changed.ts';
import { vip, normalDay, order } from './fixtures.ts';

beforeEach(resetInfra);

test('antes do commit: VIP paga R$ 188,82 e economiza R$ 20,98', () => {
  assert.equal(new Before().checkout(order, vip, normalDay).total, 18882);
  assert.match(mailer.outbox[0].body, /economizou R\$\s20,98/);
});

test('depois do commit do e-mail, o PREÇO mudou: R$ 188,80 (o bug)', () => {
  assert.equal(new Changed().checkout(order, vip, normalDay).total, 18880);
  assert.equal(db.rows[0].data.total, 18880);
  assert.match(mailer.outbox[0].body, /economizou R\$\s21,00/);
});
