import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLayoutRegistry } from '../../src/domain/layout/defaultLayoutRegistry.ts';
import { Box } from '../../src/domain/layout/Box.ts';
import { SafeArea } from '../../src/domain/layout/SafeArea.ts';
import { VECTOR_BACKGROUNDS } from '../../src/domain/scenario/BackgroundSource.ts';
import type { ScenarioScene } from '../../src/domain/script/Scene.ts';
import { AspectRatio } from '../../src/domain/values/AspectRatio.ts';
import { Language } from '../../src/domain/values/Language.ts';
import { sceneSchema } from '../../src/infrastructure/schema/sceneSchema.ts';

const SCENES = fileURLToPath(new URL('../../presets/scenes', import.meta.url));
// The backgrounds added with the era library: each one has at least one ready scene.
const ERA_BACKGROUNDS = [
  'cave', 'ancient-egypt', 'ancient-rome', 'medieval-castle', 'pirate-ship', 'victorian-street', 'fifties-diner',
  'classroom', 'office', 'city-night', 'space-station', 'cyber-city', 'graveyard', 'haunted-house',
];

type Preset = Readonly<{ file: string; name: string; description: string; scene: ScenarioScene }>;

async function presets(): Promise<Preset[]> {
  const files = (await readdir(SCENES)).filter((file) => file.endsWith('.json')).sort();
  return Promise.all(files.map(async (file) => ({ file, ...JSON.parse(await readFile(join(SCENES, file), 'utf8')) })));
}

const withCharacters = (scene: ScenarioScene, aspect: AspectRatio): ScenarioScene => ({
  ...scene,
  characters: aspect.vertical()
    ? [{ character: 'ana', position: 'left' }, { character: 'beto', position: 'right' }]
    : [{ character: 'ana', position: 'left' }, { character: 'beto', position: 'center' }, { character: 'caio', position: 'right' }],
});

test('every scene preset is a pt-BR name, a description and a scenario scene the script schema accepts', async () => {
  const all = await presets();
  assert.ok(all.length >= ERA_BACKGROUNDS.length);
  for (const { file, name, description, scene } of all) {
    assert.match(file, /^[a-z0-9]+(-[a-z0-9]+)*\.json$/);
    assert.ok(name.length > 3 && description.length > 10, file);
    const parsed = sceneSchema.safeParse(scene);
    assert.ok(parsed.success, `${file}: ${parsed.error?.message}`);
    assert.equal(scene.type, 'scenario', file);
    assert.deepEqual(scene.characters, [], `${file}: the preset leaves the characters to the script`);
  }
});

test('every scene preset names a known vector background (an unknown name would quietly fall back to the room)', async () => {
  for (const { file, scene } of await presets()) {
    assert.ok(VECTOR_BACKGROUNDS.some((known) => known === scene.background.vector), `${file}: ${scene.background.vector}`);
    assert.equal(scene.background.image, undefined, file);
  }
});

test('every era background has at least one ready scene', async () => {
  const used = new Set((await presets()).map(({ scene }) => scene.background.vector));
  for (const background of ERA_BACKGROUNDS) assert.ok(used.has(background), background);
});

// A full HUD (two fields and the bar) and the README's big text: the check must still find every box inside the safe area.
const LONG_HUD = { fields: [{ label: 'DIA', value: '3' }, { label: 'SEM', value: 'WI-FI' }], bar: { label: 'PACIÊNCIA', value: 40 } };
const LONG_HIGHLIGHT = { text: 'E SE A INTERNET PARASSE?' };

test('every scene preset, with the most characters, a long HUD and a big text, passes the layout check in 9:16 and 16:9', async () => {
  const registry = createLayoutRegistry();
  const check = (file: string, candidate: ScenarioScene, aspect: AspectRatio) => {
    const boxes = registry.boxesOf(candidate, aspect, Language.PORTUGUESE)!;
    const label = `${file} ${aspect.text()}`;
    assert.ok(boxes.overlappingPairs().length + boxes.outsideOf(SafeArea.for(aspect)).length + boxes.overflowingTexts().length === 0, label);
    return boxes;
  };
  const nowhere = Box.of('nowhere', { x: 0, y: 0, width: 0, height: 0 });
  const aspects = ['9:16', '16:9'].map((text) => AspectRatio.of(text));
  for (const { file, scene: raw } of await presets()) {
    const scene = sceneSchema.parse(raw) as ScenarioScene;
    aspects.forEach((aspect) => {
      const crowded = withCharacters(scene, aspect);
      check(file, crowded, aspect);
      const dressed = check(file, { ...crowded, hud: LONG_HUD, highlight: LONG_HIGHLIGHT }, aspect);
      assert.ok(dressed.outsideOf(nowhere).length >= 3, `${file} ${aspect.text()}: the HUD and the big text are measured`);
    });
  }
});
