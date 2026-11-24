import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Expression } from '../../../src/domain/cast/PoseAndExpression.ts';
import { CharacterState } from '../../../src/domain/character/CharacterState.ts';
import { LiaStyleMouth } from '../../../src/domain/character/LiaStyleMouth.ts';
import type { Viseme } from '../../../src/domain/speech/Visemes.ts';

const state = (viseme: Viseme, opening: number, { expression = 'neutral' as Expression, speaking = true } = {}) => CharacterState.of({
  pose: 'neutral', expression, look: 'camera', speaking, viseme, opening, blink: 0, body: { y: 0, rotation: 0, scale: 1 },
});

test('silent, or at rest (X) while speaking, the mouth is the expression shape', () => {
  assert.deepEqual(LiaStyleMouth.for(state('A', 1, { expression: 'happy', speaking: false })), { kind: 'expression', shape: 'grin' });
  assert.deepEqual(LiaStyleMouth.for(state('X', 1, { expression: 'surprised' })), { kind: 'expression', shape: 'o' });
});

test('M presses the lips into a line', () => {
  assert.deepEqual(LiaStyleMouth.for(state('M', 1)), { kind: 'closed', halfWidth: 11 });
});

test('the open mouth has the motor size per viseme and hangs 0.35 of its height below the mouth line', () => {
  const mouth = LiaStyleMouth.for(state('A', 1));
  assert.equal(mouth.kind, 'open');
  if (mouth.kind !== 'open') return;
  assert.deepEqual([mouth.rx, mouth.ry], [15, 4 + 15]);
  assert.equal(mouth.cy, 19 * 0.35);
  const fixed = LiaStyleMouth.for(state('F', 1));
  assert.deepEqual(fixed.kind === 'open' && [fixed.rx, fixed.ry], [14, 5]);
});

test('the opening is held between 0.25 and 1', () => {
  const low = LiaStyleMouth.for(state('O', 0));
  assert.deepEqual(low.kind === 'open' && low.ry, 6 + 10 * 0.25);
  const high = LiaStyleMouth.for(state('O', 3));
  assert.deepEqual(high.kind === 'open' && high.ry, 6 + 10);
});

test('teeth show on I, E and F only, at most 6 tall', () => {
  const withTeeth = (['A', 'E', 'I', 'O', 'U', 'F', 'C'] as const).filter((viseme) => {
    const mouth = LiaStyleMouth.for(state(viseme, 1));
    return mouth.kind === 'open' && mouth.teeth !== undefined;
  });
  assert.deepEqual(withTeeth, ['E', 'I', 'F']);
  const mouth = LiaStyleMouth.for(state('E', 1));
  if (mouth.kind !== 'open' || !mouth.teeth) return assert.fail('E has teeth');
  assert.deepEqual(mouth.teeth, { x: -17 * 0.7, y: mouth.cy - 12, width: 17 * 1.4, height: 6 });
  const short = LiaStyleMouth.for(state('I', 0.25));
  assert.equal(short.kind === 'open' && short.teeth?.height, (2 + 6 * 0.25) * 0.8);
});

test('the tongue shows on A and O only once the mouth is more than 9 tall', () => {
  const open = LiaStyleMouth.for(state('A', 1));
  assert.ok(open.kind === 'open' && open.tongue);
  const closing = LiaStyleMouth.for(state('A', 0.25)); // ry = 4 + 15 × 0.25 = 7.75
  assert.equal(closing.kind === 'open' && closing.tongue, undefined);
  const crossing = LiaStyleMouth.for(state('O', 0.31)); // ry = 6 + 10 × 0.31 = 9.1
  assert.ok(crossing.kind === 'open' && crossing.tongue);
  const wide = LiaStyleMouth.for(state('E', 1));
  assert.equal(wide.kind === 'open' && wide.tongue, undefined);
});

test('the tongue sits in the lower half of the open mouth', () => {
  const mouth = LiaStyleMouth.for(state('A', 1));
  if (mouth.kind !== 'open' || !mouth.tongue) return assert.fail('A has a tongue');
  assert.deepEqual(mouth.tongue, { cx: 0, cy: mouth.cy + 19 * 0.5, rx: 15 * 0.6, ry: 19 * 0.35 });
});
