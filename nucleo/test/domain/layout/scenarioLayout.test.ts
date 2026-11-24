import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLayoutRegistry } from '../../../src/domain/layout/defaultLayoutRegistry.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import type { ScenarioScene } from '../../../src/domain/script/Scene.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import { Language } from '../../../src/domain/values/Language.ts';

const scene: ScenarioScene = {
  type: 'scenario',
  background: { vector: 'village' },
  characters: [{ character: 'ana', position: 'left' }, { character: 'bia', position: 'right' }],
  hud: { fields: [{ label: 'DIA', value: '3' }, { label: 'SEM', value: 'WI-FI' }], bar: { label: 'PACIÊNCIA', value: 65 } },
  highlight: { text: 'O WI-FI CAIU' },
};
const boxesOf = (value: ScenarioScene, aspect: string) =>
  createLayoutRegistry().boxesOf(value, AspectRatio.of(aspect), Language.PORTUGUESE);

test('the scenario scene declares the HUD and big text boxes, all inside the safe area and apart', () => {
  for (const aspect of ['9:16', '16:9']) {
    const boxes = boxesOf(scene, aspect)!;
    assert.deepEqual(boxes.outsideOf(SafeArea.for(AspectRatio.of(aspect))), []);
    assert.deepEqual(boxes.overlappingPairs(), []);
    assert.deepEqual(boxes.overflowingTexts(), []);
  }
});

test('a scenario without HUD or big text takes no text box', () => {
  const bare: ScenarioScene = { type: 'scenario', background: {}, characters: [] };
  assert.deepEqual(boxesOf(bare, '9:16')!.overlappingPairs(), []);
  assert.deepEqual(boxesOf(bare, '9:16')!.outsideOf(SafeArea.for(AspectRatio.of('9:16'))), []);
});

test('the layout rejects three characters in 9:16 and a camera target out of the scene', () => {
  const crowded = { ...scene, characters: [...scene.characters, { character: 'caio', position: 'center' as const }] };
  assert.throws(() => boxesOf(crowded, '9:16'), /no máximo 2 personagens em 9:16/);
  const lost = { ...scene, camera: { type: 'follow' as const, target: 'zeca' } };
  assert.throws(() => boxesOf(lost, '16:9'), /alvo da câmera "zeca"/);
});
