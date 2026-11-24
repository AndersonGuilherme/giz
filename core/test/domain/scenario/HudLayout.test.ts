import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HudLayout } from '../../../src/domain/scenario/HudLayout.ts';
import { Box } from '../../../src/domain/layout/Box.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import type { Hud } from '../../../src/domain/script/SceneElements.ts';

const HUD: Hud = {
  fields: [{ label: 'DIA', value: '3' }, { label: 'SEM', value: 'WI-FI' }, { label: 'HUMOR', value: '7' }],
  bar: { label: 'PACIÊNCIA ATÉ A NOITE', value: 65 },
};
const ASPECTS = ['9:16', '16:9'].map((text) => AspectRatio.of(text));

test('HUD inside the safe area in both aspect ratios', () => {
  for (const aspect of ASPECTS) {
    const layout = HudLayout.for(HUD, aspect);
    const safeArea = SafeArea.for(aspect);
    assert.ok(Box.of('painel', layout.panel).isInside(safeArea), `painel fora em ${aspect.text()}`);
    assert.deepEqual(layout.boxes().outsideOf(safeArea), []);
    assert.deepEqual(layout.boxes().overlappingPairs(), []);
  }
});

test('the HUD sits on the top left corner of the safe area', () => {
  for (const aspect of ASPECTS) {
    const { panel } = HudLayout.for(HUD, aspect);
    const safeArea = SafeArea.for(aspect);
    assert.deepEqual([panel.x, panel.y], [safeArea.x, safeArea.y]);
    assert.ok(panel.width < safeArea.width);
  }
});

test('the fields become one line separated by dots, fitted by TextFit', () => {
  const layout = HudLayout.for(HUD, AspectRatio.of('16:9'));
  assert.deepEqual(layout.fields.fit.lines, ['DIA 3 · SEM WI-FI · HUMOR 7']);
  assert.ok(layout.fields.fit.fits);
});

test('the bar fill follows the value and clamps it to 0–100', () => {
  const layout = HudLayout.for(HUD, AspectRatio.of('16:9'));
  assert.equal(layout.bar?.percent, '65%');
  assert.ok(Math.abs(layout.bar!.fill.width - layout.bar!.track.width * 0.65) < 1e-9);
  const over = HudLayout.for({ ...HUD, bar: { label: 'X', value: 140 } }, AspectRatio.of('16:9'));
  assert.equal(over.bar!.fill.width, over.bar!.track.width);
  assert.equal(over.bar!.percent, '100%');
});

test('without a bar the panel is shorter and has only the fields', () => {
  const withBar = HudLayout.for(HUD, AspectRatio.of('9:16'));
  const withoutBar = HudLayout.for({ fields: HUD.fields }, AspectRatio.of('9:16'));
  assert.equal(withoutBar.bar, undefined);
  assert.ok(withoutBar.panel.height < withBar.panel.height);
});

test('too many fields shrink the letters; when even that is not enough, the check sees it', () => {
  const crowded: Hud = { fields: Array.from({ length: 12 }, (_, i) => ({ label: `CAMPO${i}`, value: String(i * 1000) })) };
  const layout = HudLayout.for(crowded, AspectRatio.of('9:16'));
  assert.equal(layout.fields.fit.fits, false);
  assert.equal(layout.boxes().overflowingTexts().length, 1);
});
