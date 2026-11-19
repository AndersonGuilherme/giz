// Rode com: node --test   (dentro desta pasta)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { precoFinal } from './exemplo.ts';

test('sem cupom, o preço não muda', () => assert.equal(precoFinal(100), 100));
test('cupom BEMVINDO dá R$ 10 de desconto', () => assert.equal(precoFinal(100, 'BEMVINDO'), 90));
