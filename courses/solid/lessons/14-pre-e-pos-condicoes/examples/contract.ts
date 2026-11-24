import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Payment } from './payment.ts';

const day = (n: number) => new Date(2026, 0, 1 + n);

// O contrato de Payment, escrito UMA vez e aplicado a todo subtipo.
export function paymentContract(name: string, make: (amount: number) => Payment) {
  const captured = () => { const p = make(8000); p.authorize(); p.capture(day(0)); return p; };

  describe(name, () => {
    test('pré: estorna capturado, mesmo 120 dias depois', () => {
      assert.doesNotThrow(() => captured().refund(8000, day(120)));
    });
    test('pós: refunded aumenta exatamente o valor', () => {
      const p = captured();
      p.refund(3000, day(1));
      assert.equal(p.refunded, 3000);
    });
    test('invariante: nunca devolve mais que o pago', () => {
      const p = captured();
      p.refund(8000, day(1));
      assert.throws(() => p.refund(8000, day(2)));
    });
  });
}
