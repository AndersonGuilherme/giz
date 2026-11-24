// LSP: o contrato que TODO método de entrega cumpre, verificado em todos eles com os mesmos pedidos.
import { test } from 'node:test';
import assert from 'node:assert/strict';

type Quote = { subtotal: number; distanceKm: number };
type Method = { id: string; price(q: Quote): number; available?(q: Quote): boolean };

const quotes: Quote[] = [
  { subtotal: 5000, distanceKm: 4 },
  { subtotal: 21000, distanceKm: 0 },
  { subtotal: 5000, distanceKm: 20 }, // longe da loja
];

export function shippingContract(methods: Method[]) {
  for (const m of methods) {
    test(`${m.id}: cumpre o contrato do frete`, () => {
      for (const q of quotes) {
        if (m.available && !m.available(q)) continue; // indisponível é resposta válida
        const price = m.price(q); // disponível: não pode lançar
        assert.ok(price >= 0);
      }
    });
  }
}
