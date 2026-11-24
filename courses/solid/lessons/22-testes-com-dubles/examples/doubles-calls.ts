// Dublês que olham COMO a peça foi chamada.
import assert from 'node:assert/strict';
import type { Notifier } from './domain/ports.ts';

type Call = [email: string, total: number, saved: number];

// Spy: anota cada chamada. O teste confere depois.
export class SpyNotifier implements Notifier {
  calls: Call[] = [];
  async orderConfirmed(...call: Call) { this.calls.push(call); }
}

// Mock: já nasce sabendo o que esperar, e confere sozinho.
export class MockNotifier implements Notifier {
  private expected: Call;
  private called = 0;
  constructor(...expected: Call) { this.expected = expected; }
  async orderConfirmed(...call: Call) {
    assert.deepEqual(call, this.expected); // falha na hora, se vier diferente
    this.called++;
  }
  verify() { assert.equal(this.called, 1, 'esperava exatamente 1 aviso'); }
}
