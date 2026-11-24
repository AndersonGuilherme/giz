import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MouthLayout } from '../../../src/domain/character/MouthLayout.ts';
import { MouthGeometry, type SpeechShape } from '../../../src/domain/character/MouthGeometry.ts';
import type { MouthShape } from '../../../src/domain/character/FaceGeometry.ts';

const speech = (extra: Partial<SpeechShape>): SpeechShape =>
  ({ width: 28, height: 10, teeth: true, tongue: false, outline: 'oval', lipTuck: false, ...extra });
const silent = (extra: Partial<MouthShape>): MouthShape => ({ width: 26, curve: 5, opening: 0, tilt: 0, wave: 0, ...extra });

test('pressed lips (height 0) are a single line', () => {
  assert.deepEqual(MouthLayout.ofSpeech(MouthGeometry.for('M', 1)).outline, { kind: 'pressed', width: 24 });
});

test('an oval speech mouth sits a bit below the mouth line and spans its height', () => {
  const { outline } = MouthLayout.ofSpeech(speech({ height: 10 }));
  assert.deepEqual(outline, { kind: 'oval', width: 28, height: 10, center: 5 * 0.3 });
});

test('the wide outline caps its corner radius; a short one stays fully round', () => {
  const tall = MouthLayout.ofSpeech(speech({ outline: 'wide', height: 20 })).outline;
  const short = MouthLayout.ofSpeech(speech({ outline: 'wide', height: 4 })).outline;
  assert.equal(tall.kind === 'rounded' && tall.corner, MouthLayout.MAXIMUM_CORNER);
  assert.equal(short.kind === 'rounded' && short.corner, 2);
});

test('a tucked lower lip shows thicker top teeth and a lip band; normal teeth are thinner and have no lip', () => {
  const tucked = MouthLayout.ofSpeech(speech({ lipTuck: true, outline: 'wide' }));
  const normal = MouthLayout.ofSpeech(speech({}));
  assert.ok(tucked.teeth && normal.teeth && tucked.teeth.height > normal.teeth.height);
  assert.ok(tucked.lip);
  assert.equal(normal.lip, undefined);
  assert.ok(tucked.lip.y > tucked.teeth.y);
});

test('teeth thickness is capped on a very open mouth', () => {
  const huge = MouthLayout.ofSpeech(speech({ height: 60 }));
  assert.equal(huge.teeth?.height, MouthLayout.MAXIMUM_TEETH + 1);
});

test('the tongue has a minimum size and only appears when the shape asks for it', () => {
  assert.equal(MouthLayout.ofSpeech(speech({})).tongue, undefined);
  const tongue = MouthLayout.ofSpeech(speech({ tongue: true, height: 4 })).tongue;
  assert.equal(tongue?.ry, MouthLayout.MINIMUM_TONGUE);
});

test('a closed silent mouth bends with the curve, or waves when it has a wave', () => {
  assert.deepEqual(MouthLayout.ofSilent(MouthGeometry.silent(silent({}))).outline, { kind: 'line', width: 26, tilt: 0, bend: 8 });
  assert.equal(MouthLayout.ofSilent(MouthGeometry.silent(silent({ wave: 5 }))).outline.kind, 'wave');
});

test('an open silent mouth draws its cubic edges and fits the interior at 3/4 of the control points', () => {
  const layout = MouthLayout.ofSilent(MouthGeometry.silent(silent({ width: 34, curve: 12, opening: 9 })));
  assert.equal(layout.outline.kind, 'cubic');
  const edges = MouthGeometry.silent(silent({ width: 34, curve: 12, opening: 9 }));
  assert.ok(Math.abs((layout.teeth?.y ?? 0) - (edges.upper * 0.75 - 1)) < 1e-9);
});
