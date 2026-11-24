import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Boxes } from '../../../src/domain/layout/Boxes.ts';
import { scenarioBoxes } from '../../../src/domain/layout/scenarioLayout.ts';
import { SceneRegistry } from '../../../src/presentation/scenes/SceneRegistry.ts';

const Component = () => null;

test('a registered scene type hands back its component and its boxes', () => {
  const registry = SceneRegistry.empty().register('scenario', { Component, boxes: scenarioBoxes });
  assert.equal(registry.get('scenario').Component, Component);
  assert.equal(registry.get('scenario').boxes, scenarioBoxes);
});

test('a scene type without a component is a readable error listing the registered ones', () => {
  const registry = SceneRegistry.empty().register('scenario', { Component, boxes: () => Boxes.empty() });
  assert.throws(() => registry.get('title'), /cena "title" ainda não tem componente \(registradas: scenario\)/);
});
