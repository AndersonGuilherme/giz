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
  assert.deepEqual([scrubs.main, scrubs.secondary, scrubs.legs], ['#223344', '#223344', '#223344']);
  const knight = Wardrobe.palette('knight', { main: '#aa0000', accent: '#00aa00' });
  assert.deepEqual([knight.main, knight.accent], ['#aa0000', '#00aa00']);
  assert.equal(knight.secondary, Wardrobe.palette('knight', AUTO).secondary, 'the armored sleeves keep their metal');
  assert.equal(knight.shoes, Wardrobe.palette('knight', AUTO).shoes);
});

test('sleeves by outfit: bare arms in a toga, elbow sleeves in a t-shirt, long ones in a suit', () => {
  assert.equal(Wardrobe.sleeve('toga'), 'bare');
  assert.equal(Wardrobe.sleeve('casual'), 'short');
  assert.equal(Wardrobe.sleeve('suit'), 'long');
});

test('only a long sleeve covers the forearm: short sleeves and bare arms show a skin forearm', () => {
  assert.equal(Wardrobe.coversForearm('long'), true);
  assert.equal(Wardrobe.coversForearm('short'), false);
  assert.equal(Wardrobe.coversForearm('bare'), false);
});

test('sleeve length down the upper arm: none bare, about half when short (never past the elbow), past the elbow when long', () => {
  assert.equal(Wardrobe.sleeveLength('bare', 88, 88), 0);
  assert.ok(Math.abs(Wardrobe.sleeveLength('short', 88, 88) - 46) < 0.5);
  assert.equal(Wardrobe.sleeveLength('short', 88, 30), 30, 'a foreshortened arm keeps the short sleeve above the elbow');
  assert.ok(Math.abs(Wardrobe.sleeveLength('long', 88, 88) - 100) < 0.5);
  assert.ok(Math.abs(Wardrobe.sleeveLength('long', 88, 30) - 42) < 0.5, 'past the visible elbow by the same overlap');
});

test('bare legs and bare feet are rules of the palette', () => {
  assert.equal(Wardrobe.bareLegs(Wardrobe.palette('toga', AUTO)), true);
  assert.equal(Wardrobe.bareLegs(Wardrobe.palette('suit', AUTO)), false);
  assert.equal(Wardrobe.bareFeet(Wardrobe.palette('suit', AUTO)), false);
  assert.equal(Wardrobe.bareFeet({ ...Wardrobe.palette('suit', AUTO), shoes: 'skin' }), true);
});
