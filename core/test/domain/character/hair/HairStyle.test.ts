import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HAIRS, HairStyle } from '../../../../src/domain/character/hair/HairStyle.ts';
import { HeadProfile } from '../../../../src/domain/character/HeadProfile.ts';
import { HEAD_SHAPES } from '../../../../src/domain/character/HeadShape.ts';
import { covers, onEveryHead, EYES_AND_BROWS, pointsOf } from '../headGeometry.ts';

const front = (hair: (typeof HAIRS)[number], shape: (typeof HEAD_SHAPES)[number]) =>
  HairStyle.parts(hair, shape).filter(({ layer }) => layer === 'front');

test('the Gizzy hair styles, bald first, short by default', () => {
  assert.deepEqual(HAIRS, ['bald', 'short', 'long', 'curly', 'afro', 'braids', 'bun', 'ponytail', 'mohawk']);
  assert.equal(HairStyle.DEFAULT, 'short');
  assert.deepEqual(HairStyle.parts('bald', 'round'), []);
});

test('no hair over the face: the eyes and brows stay free on every head shape', () => {
  for (const [hair, shape] of onEveryHead(HAIRS)) {
    const parts = front(hair, shape);
    EYES_AND_BROWS.forEach((point) => assert.ok(!covers(parts, point), `${hair} on ${shape} covers (${point.x}, ${point.y})`));
  }
});

test('every hair but bald covers the top of the head', () => {
  for (const [hair, shape] of onEveryHead(HAIRS.filter((name) => name !== 'bald'))) {
    const top = HeadProfile.of(shape).top();
    assert.ok(covers(front(hair, shape), { x: 0, y: top + 6 }), `${hair} on ${shape}`);
  }
});

// The Task 17 short hair was one fixed path: on the narrow oval head it stuck out at the sides.
test('the hair hugs the head shape: the cap stays close to the outline, it does not overhang the oval', () => {
  for (const shape of HEAD_SHAPES) {
    const profile = HeadProfile.of(shape);
    const cap = pointsOf(front('short', shape));
    cap.forEach(({ x, y }) => {
      const angle = (Math.atan2(y, x) * 180) / Math.PI;
      assert.ok(Math.hypot(x, y) - profile.radiusAt(angle) <= 12, `${shape}: (${x.toFixed(0)}, ${y.toFixed(0)}) too far from the head`);
    });
  }
  const widest = (shape: (typeof HEAD_SHAPES)[number]) => Math.max(...pointsOf(front('short', shape)).map(({ x }) => Math.abs(x)));
  assert.ok(widest('oval') < widest('round') - 6, `oval ${widest('oval')} vs round ${widest('round')}`);
  const highest = (shape: (typeof HEAD_SHAPES)[number]) => Math.min(...pointsOf(front('short', shape)).map(({ y }) => y));
  assert.ok(highest('oval') < highest('round') - 6, 'and reaches the top of the taller oval');
});

test('long hair, braids and ponytails hang behind the head; buns sit on top', () => {
  const lowest = (hair: (typeof HAIRS)[number]) => Math.max(...pointsOf(HairStyle.parts(hair, 'round').filter(({ layer }) => layer === 'back')).map(({ y }) => y));
  for (const hair of ['long', 'braids', 'ponytail'] as const) assert.ok(lowest(hair) > 130, hair);
  const bun = HairStyle.parts('bun', 'oval').filter(({ layer }) => layer === 'back');
  assert.ok(Math.max(...pointsOf(bun).map(({ y }) => y)) < HeadProfile.of('oval').top() + 20);
  assert.ok(HairStyle.parts('bun', 'round').some(({ role }) => role === 'tie'));
});

test('the parts are built once per hair and head shape', () => {
  assert.equal(HairStyle.parts('afro', 'bean'), HairStyle.parts('afro', 'bean'));
  assert.notEqual(HairStyle.parts('afro', 'bean'), HairStyle.parts('afro', 'oval'));
});
