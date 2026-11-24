import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Placement } from '../../../src/domain/scenario/Placement.ts';
import { Stance } from '../../../src/domain/scenario/Stance.ts';
import { SafeArea } from '../../../src/domain/layout/SafeArea.ts';
import { AspectRatio } from '../../../src/domain/values/AspectRatio.ts';
import type { CharacterInScene } from '../../../src/domain/script/Scene.ts';

const VERTICAL = AspectRatio.of('9:16');
const HORIZONTAL = AspectRatio.of('16:9');
// The giz frame: feet at y = 590 inside a 520 × 630 view box.
const GIZ = Stance.of({ viewBox: { x: -60, y: -30, width: 520, height: 630 }, feet: { x: 200, y: 590 } });
const LIA_STYLE = Stance.of({ viewBox: { x: -60, y: -30, width: 520, height: 630 }, feet: { x: 200, y: 570 } });

const at = (character: string, position: CharacterInScene['position'], extra: Partial<CharacterInScene> = {}): CharacterInScene => ({
  character,
  position,
  ...extra,
});

test('in 9:16 two characters fit in the safe area', () => {
  const spots = Placement.for([at('ana', 'left'), at('bia', 'right')], VERTICAL);
  const safeArea = SafeArea.for(VERTICAL);
  assert.equal(spots.length, 2);
  for (const spot of spots) assert.ok(GIZ.boxFor(spot).isInside(safeArea), `${spot.character} sai da área segura`);
});

test('in 16:9 three characters fit in the safe area, side by side and the same size', () => {
  const spots = Placement.for([at('ana', 'left'), at('bia', 'center'), at('caio', 'right')], HORIZONTAL);
  const safeArea = SafeArea.for(HORIZONTAL);
  for (const spot of spots) assert.ok(GIZ.boxFor(spot).isInside(safeArea), `${spot.character} sai da área segura`);
  assert.deepEqual(new Set(spots.map((spot) => spot.height)).size, 1);
  assert.deepEqual(new Set(spots.map((spot) => spot.y)).size, 1);
  assert.ok(spots[0]!.x < spots[1]!.x && spots[1]!.x < spots[2]!.x);
});

test('three characters in 9:16 are a readable layout error', () => {
  const three = [at('ana', 'left'), at('bia', 'center'), at('caio', 'right')];
  assert.throws(() => Placement.for(three, VERTICAL), /no máximo 2 personagens em 9:16/);
});

test('four characters in 16:9 are a readable layout error', () => {
  const four = [at('ana', 'left'), at('bia', 'center'), at('caio', 'right'), at('davi', { x: 0.5, y: 0.9 })];
  assert.throws(() => Placement.for(four, HORIZONTAL), /no máximo 3 personagens em 16:9/);
});

test('in 9:16 the second character is smaller and behind, and is drawn first', () => {
  const spots = Placement.for([at('ana', 'left'), at('bia', 'right')], VERTICAL);
  const [back, front] = spots;
  assert.equal(back!.character, 'bia');
  assert.equal(front!.character, 'ana');
  assert.ok(back!.height < front!.height);
  assert.ok(back!.y < front!.y, 'quem está atrás pisa mais acima');
});

test('the feet of every rig rest on the same ground line', () => {
  const [spot] = Placement.for([at('ana', 'center')], HORIZONTAL);
  const giz = GIZ.rectangleFor(spot!);
  const liaStyle = LIA_STYLE.rectangleFor(spot!);
  const feetOf = (rectangle: typeof giz, feetY: number) => rectangle.y + ((feetY + 30) / 630) * rectangle.height;
  assert.ok(Math.abs(feetOf(giz, 590) - spot!.y) < 1e-9);
  assert.ok(Math.abs(feetOf(liaStyle, 570) - spot!.y) < 1e-9);
  assert.ok(Math.abs(giz.x + ((200 + 60) / 520) * giz.width - spot!.x) < 1e-9, 'o centro dos pés fica no x do lugar');
});

test('without a direction, a character faces the center of the frame; with one, it faces where it is told', () => {
  const [left, right] = Placement.for([at('ana', 'left'), at('bia', 'right')], HORIZONTAL);
  assert.equal(left!.side, 1);
  assert.equal(right!.side, -1);
  const [turned] = Placement.for([at('ana', 'left', { direction: 'left' })], HORIZONTAL);
  assert.equal(turned!.side, -1);
});

test('a point position places the feet at that fraction of the frame, and the scale grows the character', () => {
  const [plain] = Placement.for([at('ana', { x: 0.4, y: 0.8 })], HORIZONTAL);
  const [scaled] = Placement.for([at('ana', { x: 0.4, y: 0.8 }, { scale: 1.2 })], HORIZONTAL);
  assert.equal(plain!.x, 0.4 * 1920);
  assert.equal(plain!.y, 0.8 * 1080);
  assert.ok(Math.abs(scaled!.height - plain!.height * 1.2) < 1e-9);
});

test('the ground line is the same one the backgrounds draw their floor on', () => {
  const [spot] = Placement.for([at('ana', 'center')], VERTICAL);
  assert.equal(spot!.y, Placement.groundOf(VERTICAL));
});
