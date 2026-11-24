import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RigDefinition } from '../../../src/presentation/rigs/RigModel.ts';
import { RigRegistry, rigRegistry } from '../../../src/presentation/rigs/rigRegistry.ts';

const STANCE = { viewBox: { x: 0, y: 0, width: 100, height: 100 }, feet: { x: 50, y: 100 } };

test('the registry refuses an unknown rig listing the valid ones', () => assert.throws(() => rigRegistry.get('robot'), /giz|lia-style/));

test('the giz rig comes registered with the house-style parameters: skin tones, head shapes, eyes and chalk', () => {
  const { parameters, name } = rigRegistry.get('giz');
  assert.equal(name['pt-BR'], 'Giz');
  assert.deepEqual(parameters.skin, {
    type: 'option', defaultValue: 'medium',
    options: ['light', 'fair', 'medium', 'tan', 'brown', 'deep', 'grey-green', 'pale', 'fur', 'linen', 'mist', 'steel', 'green', 'lilac', 'lime'],
  });
  assert.deepEqual(parameters.species, {
    type: 'option', defaultValue: 'human', options: ['human', 'zombie', 'vampire', 'werewolf', 'mummy', 'ghost', 'robot', 'alien', 'slime-monster'],
  });
  assert.deepEqual(parameters.headShape, { type: 'option', defaultValue: 'round', options: ['round', 'oval', 'soft-square', 'bean'] });
  assert.deepEqual(parameters.eyeColor, { type: 'color', defaultValue: '#7a4a26' });
  assert.deepEqual(parameters.hairColor, { type: 'color', defaultValue: '#3a2418' });
  assert.deepEqual(parameters.cheeks, { type: 'boolean', defaultValue: true });
  assert.deepEqual(parameters.freckles, { type: 'boolean', defaultValue: false });
  assert.deepEqual(parameters.chalk, { type: 'boolean', defaultValue: true });
  const [outfit, headwear] = [parameters.outfit!, parameters.headwear!];
  assert.equal(outfit.defaultValue, 'casual');
  assert.deepEqual(outfit.options!.slice(0, 3), ['caveman', 'ancient-egypt', 'toga']);
  assert.equal(outfit.options!.length, 25);
  assert.deepEqual(parameters.hair, { type: 'option', defaultValue: 'short', options: ['bald', 'short', 'long', 'curly', 'afro', 'braids', 'bun', 'ponytail', 'mohawk'] });
  assert.equal(headwear.defaultValue, 'none');
  assert.ok(headwear.options!.includes('space-helmet'));
  assert.deepEqual(parameters.facialHair, { type: 'option', defaultValue: 'none', options: ['none', 'beard', 'mustache', 'goatee', 'stubble'] });
  for (const color of ['outfitColor', 'accessoryColor', 'headwearColor']) {
    assert.deepEqual(parameters[color], { type: 'color', defaultValue: 'auto' }, `${color}: the outfit's or headwear's own palette`);
  }
  assert.deepEqual(parameters.glasses, { type: 'boolean', defaultValue: false });
  assert.deepEqual(parameters.eyeScale, { type: 'number', defaultValue: 1, min: 0.8, max: 1.4 });
  assert.deepEqual(Object.keys(parameters).sort(), [
    'accessoryColor', 'chalk', 'cheeks', 'eyeColor', 'eyeScale', 'facialHair', 'freckles', 'glasses', 'hair', 'hairColor', 'headShape', 'headwear',
    'headwearColor', 'outfit', 'outfitColor', 'skin', 'species',
  ]);
});

test('the giz heads are not black by default: no color parameter defaults to black', () => {
  const { parameters } = rigRegistry.get('giz');
  const colors = Object.values(parameters).filter(({ type }) => type === 'color').map(({ defaultValue }) => String(defaultValue));
  assert.ok(colors.every((color) => !['#000000', '#151515', '#101010'].includes(color)));
});

test('register adds and all() returns in registration order', () => {
  const registry = RigRegistry.with<RigDefinition>([]);
  registry.register({ id: 'a', name: { 'pt-BR': 'A', en: 'A' }, parameters: {}, stance: STANCE });
  registry.register({ id: 'b', name: { 'pt-BR': 'B', en: 'B' }, parameters: {}, stance: STANCE });
  assert.deepEqual(registry.all().map(({ id }) => id), ['a', 'b']);
});

test('registering the same id twice is an error', () => {
  const registry = RigRegistry.with<RigDefinition>([{ id: 'a', name: { 'pt-BR': 'A', en: 'A' }, parameters: {}, stance: STANCE }]);
  assert.throws(() => registry.register({ id: 'a', name: { 'pt-BR': 'A', en: 'A' }, parameters: {}, stance: STANCE }), /já registrado/);
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

test('every rig declares where its feet touch the ground, inside its view box (giz 590, lia-style 570)', () => {
  for (const { id, stance } of rigRegistry.all()) {
    const { viewBox, feet } = stance;
    assert.ok(feet.y > viewBox.y && feet.y <= viewBox.y + viewBox.height, id);
    assert.ok(feet.x > viewBox.x && feet.x < viewBox.x + viewBox.width, id);
  }
  assert.equal(rigRegistry.get('giz').stance.feet.y, 590);
  assert.equal(rigRegistry.get('lia-style').stance.feet.y, 570);
});
