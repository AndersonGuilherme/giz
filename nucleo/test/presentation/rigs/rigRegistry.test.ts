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

test('the lia-style comes registered with the parameters, ranges and options from the brief', () => {
  const { parameters, name } = rigRegistry.get('lia-style');
  assert.equal(name['pt-BR'], 'Estilo Lia');
  assert.deepEqual(parameters.hair, { type: 'option', defaultValue: 'bun', options: ['long', 'short', 'shaved', 'bun'] });
  assert.deepEqual(parameters.emblem, { type: 'option', defaultValue: 'star', options: ['star', 'code', 'none'] });
  assert.deepEqual(parameters.glasses, { type: 'boolean', defaultValue: true });
  assert.deepEqual(parameters.browWidth, { type: 'number', defaultValue: 7, min: 5, max: 12 });
  assert.deepEqual(parameters.browArch, { type: 'number', defaultValue: 7, min: 0, max: 9 });
  assert.deepEqual(parameters.smile, { type: 'number', defaultValue: 30, min: 18, max: 34 });
  for (const color of ['skin', 'hairColor', 'hairColor2', 'hoodieColor', 'hoodieShade', 'glassesColor']) {
    assert.equal(parameters[color]!.type, 'color', color);
  }
  assert.deepEqual(Object.keys(parameters).sort(), [
    'browArch', 'browWidth', 'emblem', 'glasses', 'glassesColor', 'hair', 'hairColor', 'hairColor2', 'hoodieColor', 'hoodieShade', 'skin', 'smile',
  ]);
});
