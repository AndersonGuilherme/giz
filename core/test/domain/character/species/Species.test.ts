import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPRESSIONS, type Expression } from '../../../../src/domain/cast/PoseAndExpression.ts';
import { CharacterState } from '../../../../src/domain/character/CharacterState.ts';
import { FaceGeometry } from '../../../../src/domain/character/FaceGeometry.ts';
import { HeadProfile } from '../../../../src/domain/character/HeadProfile.ts';
import { MouthLayout, type MouthOutline } from '../../../../src/domain/character/MouthLayout.ts';
import { fangsOf } from '../../../../src/domain/character/species/Fangs.ts';
import { SkinTone } from '../../../../src/domain/character/SkinTone.ts';
import { SPECIES, Species, type SpeciesName } from '../../../../src/domain/character/species/Species.ts';
import { Wardrobe } from '../../../../src/domain/character/wardrobe/Wardrobe.ts';
import type { Viseme } from '../../../../src/domain/speech/Visemes.ts';
import { covers, EYES_AND_BROWS, onEveryHead, pointsOf } from '../headGeometry.ts';

const VISEMES: readonly Viseme[] = ['X', 'M', 'A', 'E', 'I', 'O', 'U', 'F', 'C'];
const CREATURES = SPECIES.filter((name) => name !== 'human');
const pairs = <First, Second>(firsts: readonly First[], seconds: readonly Second[]) =>
  firsts.flatMap((first) => seconds.map((second) => [first, second] as const));

const state = (data: Partial<{ expression: Expression; speaking: boolean; viseme: Viseme; opening: number; blink: number }>) => CharacterState.of({
  pose: 'neutral', expression: 'neutral', look: 'camera', speaking: false, viseme: 'X', opening: 0, blink: 0, body: { y: 0, rotation: 0, scale: 1 }, ...data,
});

test('the species: human (the default) and eight generic creatures', () => {
  assert.deepEqual(SPECIES, ['human', 'zombie', 'vampire', 'werewolf', 'mummy', 'ghost', 'robot', 'alien', 'slime-monster']);
  assert.equal(Species.DEFAULT, 'human');
});

test('humans keep the chosen skin; each creature has its own skin unless another creature skin was chosen', () => {
  assert.equal(Species.skin('human', 'tan'), 'tan');
  for (const name of CREATURES) assert.ok(SkinTone.isCreature(Species.skin(name, 'medium')), name);
  assert.equal(Species.skin('zombie', 'tan'), 'grey-green');
  assert.equal(Species.skin('vampire', 'light'), 'pale');
  assert.equal(Species.skin('alien', 'lilac'), 'lilac');
  assert.equal(Species.skin('slime-monster', 'medium'), 'tangerine', 'an orange slime by default');
  assert.equal(Species.skin('slime-monster', 'lime'), 'lime', 'green is still an option');
  assert.equal(new Set(CREATURES.map((name) => Species.skin(name, 'medium'))).size, CREATURES.length, 'one skin per creature');
});

test('the ghost has no legs and floats a little above the ground with a gentle bob; the others stand on it', () => {
  const lifts = Array.from({ length: 40 }, (_empty, index) => Species.lift('ghost', index * 0.1).y);
  assert.ok(lifts.every((y) => y <= -39 && y >= -53), lifts.join());
  assert.ok(Math.max(...lifts) - Math.min(...lifts) > 10, 'it bobs');
  assert.ok(Math.abs(lifts[1]! - lifts[0]!) < 2.5, 'gently: a small step per tenth of a second');
  assert.ok(Species.lift('ghost', 0).shadow < 1, 'the shadow shrinks under it');
  assert.equal(Species.hasLegs('ghost'), false);
  for (const name of SPECIES.filter((other) => other !== 'ghost')) assert.deepEqual(Species.lift(name, 1.3), { y: 0, shadow: 1 }, name);
});

test('legs: only the ghost and the slime monster have none', () => {
  assert.deepEqual(SPECIES.filter((name) => !Species.hasLegs(name)), ['ghost', 'slime-monster']);
});

test('creatures without clothes (mummy, ghost, slime) have bare arms and skin legs; the others keep the outfit', () => {
  const palette = Wardrobe.palette('casual', { main: 'auto', accent: 'auto' });
  assert.deepEqual(SPECIES.filter((name) => !Species.isClothed(name)), ['mummy', 'ghost', 'slime-monster']);
  for (const name of SPECIES) {
    const clothed = Species.isClothed(name);
    assert.equal(Species.sleeve(name, 'long'), clothed ? 'long' : 'bare', name);
    assert.deepEqual(Species.palette(name, palette), clothed ? palette : { ...palette, legs: 'skin', shoes: 'skin' }, name);
  }
});

test('every species renders a mouth for each viseme: the same shape a human makes, so lip-sync keeps working', () => {
  for (const [[name, viseme], opening] of pairs(pairs(SPECIES, VISEMES), [0.3, 1])) {
    const speaking = state({ speaking: true, viseme, opening });
    const mouth = Species.mouth(name, speaking);
    assert.deepEqual(mouth.parts, MouthLayout.for(speaking), `${name} ${viseme}`);
    assert.ok(mouth.parts.outline.width > 0, `${name} ${viseme}`);
    assert.ok(['X', 'M'].includes(viseme) || mouth.parts.outline.kind !== 'pressed', `${name} ${viseme} opens`);
  }
});

test('every species keeps the expression geometry: the same mouth and pupils, lids only closing where the species says', () => {
  for (const [name, expression] of pairs(SPECIES, EXPRESSIONS)) {
    const eyes = FaceGeometry.eyes(expression, 'camera', 0);
    const own = Species.eyes(name, eyes);
    assert.deepEqual(own.pupil, eyes.pupil, `${name} ${expression}`);
    assert.deepEqual(own.right, eyes.right, `${name} ${expression}`);
    assert.ok(own.left.upper >= eyes.left.upper, `${name} ${expression}`);
    assert.deepEqual(Species.mouth(name, state({ expression })).parts, MouthLayout.for(state({ expression })), `${name} ${expression}`);
    assert.equal(Species.eyes(name, FaceGeometry.eyes(expression, 'camera', 1)).left.upper, 1, `${name} blinks`);
  }
});

test('the zombie has one droopy eye (the left lid stays half closed); the others keep both eyes as the expression', () => {
  for (const expression of EXPRESSIONS) assert.ok(Species.eyes('zombie', FaceGeometry.eyes(expression, 'other', 0)).left.upper >= 0.45, expression);
  for (const [name, expression] of pairs(SPECIES.filter((other) => other !== 'zombie'), EXPRESSIONS)) {
    const eyes = FaceGeometry.eyes(expression, 'other', 0);
    assert.deepEqual(Species.eyes(name, eyes), eyes, `${name} ${expression}`);
  }
});

test('the robot has LED eyes instead of an iris; the alien has big eyes, never so big that they touch', () => {
  assert.deepEqual(SPECIES.filter((name) => Species.eyeStyle(name) === 'led'), ['robot']);
  assert.ok(Species.eyeScale('alien', 1) >= 1.25);
  assert.equal(Species.eyeScale('alien', 1.4), 1.5);
  assert.equal(Species.eyeScale('human', 1.2), 1.2);
});

test('only the vampire has fangs: two, one each side, on the top edge of every mouth, inside its width', () => {
  for (const viseme of VISEMES) {
    const mouth = Species.mouth('vampire', state({ speaking: true, viseme, opening: 0.8 }));
    const [left, right] = mouth.fangs;
    assert.equal(mouth.fangs.length, 2, viseme);
    assert.equal(left!.x, -right!.x, viseme);
    assert.ok(right!.x + right!.width / 2 <= mouth.parts.outline.width / 2 + 1, `${viseme} inside the mouth`);
    assert.equal(right!.y, TOP_EDGE[mouth.parts.outline.kind](mouth.parts.outline as never), viseme);
  }
  for (const name of SPECIES.filter((other) => other !== 'vampire')) assert.deepEqual(Species.mouth(name, state({ speaking: true, viseme: 'A', opening: 1 })).fangs, [], name);
});

// The expected top edge per outline kind, written out: closed lines at 0, a bent line at half its bend (quadratic), a
// cubic at 3/4 of its upper control, oval and rounded mouths at their center minus half their height.
const TOP_EDGE: Readonly<Record<MouthOutline['kind'], (outline: never) => number>> = {
  pressed: () => 0,
  wave: () => 0,
  line: ({ bend }: { bend: number }) => bend / 2,
  cubic: ({ upper }: { upper: number }) => upper * 0.75,
  oval: ({ center, height }: { center: number; height: number }) => center - height / 2,
  rounded: ({ center, height }: { center: number; height: number }) => center - height / 2,
};

test('fangs hang from the top edge of every outline kind, at the expected height', () => {
  const outlines: readonly MouthOutline[] = [
    { kind: 'pressed', width: 24 },
    { kind: 'wave', width: 26, tilt: 3, wave: 8 },
    { kind: 'line', width: 26, tilt: 0, bend: 8 },
    { kind: 'cubic', width: 34, tilt: 0, upper: -6, lower: 20 },
    { kind: 'oval', width: 20, height: 18, center: 3 },
    { kind: 'rounded', width: 38, height: 8, center: 1, corner: 4 },
  ];
  const expected = [0, 0, 4, -4.5, -6, -3];
  outlines.forEach((outline, index) => {
    const fangs = fangsOf(outline);
    assert.equal(fangs.length, 2, outline.kind);
    fangs.forEach((fang) => assert.equal(fang.y, expected[index], outline.kind));
    assert.equal(fangs[0]!.x, -fangs[1]!.x, outline.kind);
  });
});

test('the mummy wraps its arms and legs end to end, slanting one way then the other; nobody else does', () => {
  const wraps = Species.wraps('mummy', 100);
  assert.ok(wraps.length >= 5, 'close together');
  assert.ok(wraps[0]!.at < 16 && wraps.at(-1)!.at > 84, 'from end to end');
  wraps.slice(1).forEach((wrap, index) => {
    assert.ok(wrap.at > wraps[index]!.at, 'in order');
    assert.equal(wrap.slant, -wraps[index]!.slant, 'alternating');
  });
  assert.deepEqual(Species.wraps('mummy', 0), []);
  for (const name of SPECIES.filter((other) => other !== 'mummy')) assert.deepEqual(Species.wraps(name, 100), [], name);
});

test('the species features on the head never cover the eyes, on every head shape', () => {
  for (const [name, shape] of onEveryHead(SPECIES)) {
    const parts = Species.parts(name, shape);
    assert.ok(parts.every(({ layer }) => layer !== 'over'), `${name}: nothing over the face`);
    const front = parts.filter(({ layer }) => layer === 'front');
    EYES_AND_BROWS.slice(0, 6).forEach((point) => assert.ok(!covers(front, point), `${name} on ${shape} covers (${point.x}, ${point.y})`));
  }
});

test('every creature has its features; ears and antennae rise above the head; the parts are built once', () => {
  assert.deepEqual(Species.parts('human', 'round'), []);
  for (const name of CREATURES) assert.ok(Species.parts(name, 'round').length > 0, name);
  for (const [name, shape] of onEveryHead<SpeciesName>(['werewolf', 'robot', 'alien'])) {
    const top = Math.min(...pointsOf(Species.parts(name, shape)).map(({ y }) => y));
    assert.ok(top < HeadProfile.of(shape).top() - 25, `${name} on ${shape}: ${top.toFixed(0)}`);
  }
  assert.equal(Species.parts('mummy', 'bean'), Species.parts('mummy', 'bean'));
});

test('the mummy is wrapped: bandage strips cross the head above the brows and below the eyes', () => {
  for (const shape of ['round', 'oval', 'soft-square', 'bean'] as const) {
    const strips = Species.parts('mummy', shape).filter(({ role, layer }) => role === 'bandage' && layer === 'front');
    assert.ok(strips.length >= 5, shape);
    assert.ok(covers(strips, { x: 0, y: -60 }) && covers(strips, { x: 0, y: 62 }), shape);
  }
});
