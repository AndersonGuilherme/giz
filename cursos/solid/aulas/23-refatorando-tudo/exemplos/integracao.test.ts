// A infra de verdade continua testada: UM teste de integração, pela raiz de composição.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { db, mailer, resetInfra } from './infra.ts';
import { orderService } from './passo5/main.ts';

beforeEach(resetInfra);

test('integração: produção grava o pedido e manda o e-mail', () => {
  orderService.checkout({ items: [{ price: 21000, quantity: 1 }], shippingMethod: 'standard' }, { id: 'c1', email: 'ana@exemplo.com', type: 'regular' });
  assert.equal(db.rows.length, 1);
  assert.match(mailer.outbox[0].body, /^Pedido confirmado! Total: R\$\s210,00/);
});
