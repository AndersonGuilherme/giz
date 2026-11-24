import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEADWEARS, Headwear, type HeadwearName } from '../../../../src/domain/character/headwear/Headwear.ts';
import { HeadProfile } from '../../../../src/domain/character/HeadProfile.ts';
import { HEAD_SHAPES, type HeadShapeName } from '../../../../src/domain/character/HeadShape.ts';
import { covers, onEveryHead, EYES_AND_BROWS, pointsOf } from '../headGeometry.ts';

const HEX = /^#[0-9a-f]{6}$/;
const worn = HEADWEARS.filter((name) => name !== 'none');

test('the headwear options: none first, the era pieces, then the hat and scarf that were hair options', () => {
  assert.deepEqual(HEADWEARS, [
    'none', 'crown', 'laurel', 'viking-helmet', 'knight-helmet', 'pirate-hat', 'top-hat', 'flat-cap', 'beret', 'cap', 'chef-hat',
    'hard-hat', 'space-helmet', 'visor', 'headphones', 'witch-hat', 'hat', 'scarf',
  ]);
  assert.equal(Headwear.DEFAULT, 'none');
  assert.deepEqual(Headwear.parts('none', 'round'), []);
});

// `back` parts are hidden by the head; `front` parts are drawn on it, under the face; `over` parts on top of the face.
test('only see-through pieces (glass, drawn over the face) may cover the eyes', () => {
  for (const [headwear, shape] of onEveryHead(worn)) {
    const solid = Headwear.parts(headwear, shape).filter(({ layer }) => layer === 'front');
    EYES_AND_BROWS.slice(0, 6).forEach((point) => assert.ok(!covers(solid, point), `${headwear} on ${shape} covers (${point.x}, ${point.y})`));
  }
  assert.ok(Headwear.parts('visor', 'round').some(({ layer, role }) => layer === 'over' && role === 'glass'));
});

test('every piece sits on the head: some of it touches the head outline (no floating hats)', () => {
  for (const [headwear, shape] of onEveryHead(worn.filter((name) => name !== 'space-helmet'))) {
    const profile = HeadProfile.of(shape);
    const gaps = pointsOf(Headwear.parts(headwear, shape)).map(({ x, y }) => Math.hypot(x, y) - profile.radiusAt((Math.atan2(y, x) * 180) / Math.PI));
    assert.ok(Math.min(...gaps.map(Math.abs)) < 6, `${headwear} on ${shape} floats ${Math.min(...gaps.map(Math.abs)).toFixed(1)}`);
  }
});

test('the space helmet is a bubble round the whole head, its glass drawn over the face', () => {
  for (const shape of HEAD_SHAPES) {
    const glass = Headwear.parts('space-helmet', shape).filter(({ role }) => role === 'glass');
    assert.deepEqual(glass.map(({ layer }) => layer), ['over']);
    const profile = HeadProfile.of(shape);
    const head = [-180, -135, -90, -45, 0, 45, 90, 135].map((angle) => profile.at(angle, 8));
    head.forEach((point) => assert.ok(covers(glass, point), `${shape}: (${point.x.toFixed(0)}, ${point.y.toFixed(0)})`));
  }
});

const extent = (headwear: HeadwearName, shape: HeadShapeName) => {
  const points = pointsOf(Headwear.parts(headwear, shape));
  return { width: Math.max(...points.map(({ x }) => Math.abs(x))), top: Math.min(...points.map(({ y }) => y)) };
};

test('hats and helmets follow the head shape: wider on the soft-square head, higher on the tall oval one', () => {
  for (const headwear of ['crown', 'viking-helmet', 'top-hat', 'flat-cap', 'cap', 'hard-hat', 'pirate-hat', 'chef-hat', 'witch-hat', 'hat'] as const) {
    assert.ok(extent(headwear, 'soft-square').width > extent(headwear, 'oval').width + 4, `${headwear} width`);
    assert.ok(extent(headwear, 'oval').top < extent(headwear, 'round').top - 4, `${headwear} height`);
  }
});

test('every piece has its own palette; a chosen main color replaces it, auto keeps it', () => {
  for (const headwear of worn) {
    const { main, accent } = Headwear.palette(headwear, 'auto');
    assert.match(main, HEX, headwear);
    assert.match(accent, HEX, headwear);
  }
  assert.deepEqual(Headwear.palette('crown', '#123456'), { main: '#123456', accent: Headwear.palette('crown', 'auto').accent });
});

test('the parts are built once per piece and head shape', () => {
  assert.equal(Headwear.parts('crown', 'bean'), Headwear.parts('crown', 'bean'));
});
