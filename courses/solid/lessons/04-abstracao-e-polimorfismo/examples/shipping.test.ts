import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shippingFor } from './shipping-switch.ts';
import { pickup, standard, locker, express, sameDay } from './shipping.ts';
import { shippingCost } from './checkout.ts';
import { drone } from './drone.ts';

const quote = { subtotal: 5000, distanceKm: 4 };

test('switch: locker deveria custar R$ 9 (mas o case sem break cai no express)', () => {
  assert.equal(shippingFor('locker', 5000, 4), 3500); // o bug, documentado
});

test('polimorfismo: cada método calcula o seu preço', () => {
  assert.equal(shippingCost(pickup, quote), 0);
  assert.equal(shippingCost(standard, quote), 2000);
  assert.equal(shippingCost(locker, quote), 900);
  assert.equal(shippingCost(express, quote), 3500);
  assert.equal(shippingCost(sameDay, quote), 3100);
});

test('método novo (drone) entra sem alterar checkout nem outros métodos', () => {
  assert.equal(shippingCost(drone, quote), 1900);
});
