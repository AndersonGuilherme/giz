import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RigDefinition } from '../../../src/presentation/rigs/RigModel.ts';
import { RigRegistry, rigRegistry } from '../../../src/presentation/rigs/rigRegistry.ts';

test('the registry refuses an unknown rig listing the valid ones', () => assert.throws(() => rigRegistry.get('robot'), /ball-head/));

test('the ball-head comes registered with the parameters and defaults from the brief', () => {
  const { parameters, name } = rigRegistry.get('ball-head');
  assert.equal(name['pt-BR'], 'Cabeça-bola');
  assert.deepEqual(parameters.headColor, { type: 'color', defaultValue: '#151515' });
  assert.deepEqual(parameters.shine, { type: 'boolean', defaultValue: true });
  assert.deepEqual(parameters.outfit, { type: 'option', defaultValue: 'tshirt', options: ['tshirt', 'tunic', 'dress', 'hoodie'] });
  assert.deepEqual(parameters.hair, { type: 'option', defaultValue: 'none', options: ['none', 'bun', 'short', 'scarf', 'hat'] });
  assert.deepEqual(parameters.glasses, { type: 'boolean', defaultValue: false });
  assert.deepEqual(parameters.eyeScale, { type: 'number', defaultValue: 1, min: 0.8, max: 1.4 });
  assert.deepEqual(Object.keys(parameters).sort(), [
    'accessoryColor', 'eyeScale', 'glasses', 'hair', 'headColor', 'outfit', 'outfitColor', 'shine',
  ]);
});

test('register adds and all() returns in registration order', () => {
  const registry = RigRegistry.with<RigDefinition>([]);
  registry.register({ id: 'a', name: { 'pt-BR': 'A', en: 'A' }, parameters: {} });
  registry.register({ id: 'b', name: { 'pt-BR': 'B', en: 'B' }, parameters: {} });
  assert.deepEqual(registry.all().map(({ id }) => id), ['a', 'b']);
});

test('registering the same id twice is an error', () => {
  const registry = RigRegistry.with<RigDefinition>([{ id: 'a', name: { 'pt-BR': 'A', en: 'A' }, parameters: {} }]);
  assert.throws(() => registry.register({ id: 'a', name: { 'pt-BR': 'A', en: 'A' }, parameters: {} }), /já registrado/);
});
