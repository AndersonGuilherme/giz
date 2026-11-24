// Demonstração usada na tela: a regra da loja ("frete grátis para subtotal a partir de R$ 200,
// antes de descontos") verificada contra a v3 na Black Friday.
// Não segue o padrão *.test.ts de propósito: ele FALHA, e essa falha é o conteúdo da aula.
// Rodar: node --test fragility.demo.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from './order-service.v3.ts';

test('frete grátis: subtotal de R$ 210 na Black Friday', () => {
  const ana = { id: 'c1', email: 'ana@exemplo.com', type: 'regular' as const };
  const order = { items: [{ price: 10500, quantity: 2 }], shippingMethod: 'standard' as const };
  const r = new OrderService().checkout(order, ana, new Date(2026, 10, 27));
  assert.equal(r.shipping, 0);
});
