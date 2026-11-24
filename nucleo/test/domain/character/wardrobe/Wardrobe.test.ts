import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ERAS } from '../../../../src/domain/character/wardrobe/OutfitDesign.ts';
import { OUTFITS, Wardrobe } from '../../../../src/domain/character/wardrobe/Wardrobe.ts';

const HEX = /^#[0-9a-f]{6}$/;
const AUTO = { main: 'auto', accent: 'auto' };

test('the wardrobe by era', () => {
  assert.deepEqual(Wardrobe.ofEra('past'), ['caveman', 'ancient-egypt', 'toga', 'viking', 'knight', 'commoner', 'renaissance', 'pirate', 'victorian', '1920s', '1950s']);
  assert.deepEqual(Wardrobe.ofEra('present'), ['casual', 'hoodie', 'dress', 'suit', 'school-uniform', 'lab-coat', 'scrubs', 'chef', 'athlete', 'hi-vis']);
  assert.deepEqual(Wardrobe.ofEra('future'), ['spacesuit', 'cyber', 'robot-armor', 'utopian']);
  assert.equal(OUTFITS.length, ERAS.flatMap((era) => Wardrobe.ofEra(era)).length, 'every outfit has one era');
  assert.equal(Wardrobe.DEFAULT, 'casual');
});

test('every outfit has a full palette of its own (legs may be bare skin)', () => {
  const colors = OUTFITS.flatMap((outfit) => Object.entries(Wardrobe.palette(outfit, AUTO)).map(([name, color]) => ({ outfit, name, color })));
  for (const { outfit, name, color } of colors) {
    assert.ok(HEX.test(color) || (name === 'legs' && color === 'skin'), `${outfit}.${name} = ${color}`);
  }
  assert.equal(Wardrobe.palette('toga', AUTO).legs, 'skin');
});

test('the palettes differ: no two outfits share the same main and accent', () => {
  const pairs = OUTFITS.map((outfit) => { const { main, accent } = Wardrobe.palette(outfit, AUTO); return `${main}/${accent}`; });
  assert.equal(new Set(pairs).size, OUTFITS.length);
});

test('a chosen color replaces the main or the accent; the parts sharing the main color follow it', () => {
  const scrubs = Wardrobe.palette('scrubs', { main: '#223344', accent: 'auto' });
  assert.deepEqual([scrubs.main, scrubs.sleeve, scrubs.legs], ['#223344', '#223344', '#223344']);
  const knight = Wardrobe.palette('knight', { main: '#aa0000', accent: '#00aa00' });
  assert.deepEqual([knight.main, knight.accent], ['#aa0000', '#00aa00']);
  assert.equal(knight.sleeve, Wardrobe.palette('knight', AUTO).sleeve, 'the armored sleeves keep their metal');
  assert.equal(knight.shoes, Wardrobe.palette('knight', AUTO).shoes);
});

test('sleeves by outfit: bare arms in a toga, elbow sleeves in a t-shirt, long ones in a suit', () => {
  assert.equal(Wardrobe.sleeve('toga'), 'bare');
  assert.equal(Wardrobe.sleeve('casual'), 'short');
  assert.equal(Wardrobe.sleeve('suit'), 'long');
});
