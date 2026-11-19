import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Capturable, Refundable } from './payment.ts';

export const day = (n: number) => new Date(2026, 0, 1 + n);

// Um contrato por capacidade. Quem declara a capacidade passa no contrato dela.
export function refundableContract(name: string, make: () => Refundable) {
  describe(`Refundable: ${name}`, () => {
    test('pré: se canRefund, refund não lança', () => {
      const r = make();
      assert.ok(r.canRefund(3000, day(30)));
      assert.doesNotThrow(() => r.refund(3000, day(30)));
    });
    test('pós: refunded sobe exatamente o valor', () => {
      const r = make();
      r.refund(3000, day(1));
      assert.equal(r.refunded, 3000);
    });
    test('invariante: nunca devolve mais que o pago', () => {
      const r = make();
      r.refund(8000, day(1));
      assert.equal(r.canRefund(1, day(2)), false);
      assert.throws(() => r.refund(8000, day(2)));
    });
    test('prazo: refund faz o que canRefund disse', () => {
      for (const n of [10, 100, 400]) {
        const r = make();
        const allowed = r.canRefund(8000, day(n));
        if (allowed) r.refund(8000, day(n));
        else assert.throws(() => r.refund(8000, day(n)));
        assert.equal(r.refunded, allowed ? 8000 : 0);
      }
    });
  });
}

export function capturableContract(name: string, make: () => Capturable) {
  describe(`Capturable: ${name}`, () => {
    test('capture registra a data e não lança', () => {
      const c = make();
      assert.doesNotThrow(() => c.capture(day(0)));
      assert.deepEqual(c.capturedAt, day(0));
    });
  });
}
