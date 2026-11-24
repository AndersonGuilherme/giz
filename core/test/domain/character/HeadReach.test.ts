import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HeadReach, type HeadLook } from '../../../src/domain/character/HeadReach.ts';
import { HeadProfile } from '../../../src/domain/character/HeadProfile.ts';
import { Species } from '../../../src/domain/character/species/Species.ts';

const bald: HeadLook = { species: 'human', headwear: 'none', hair: 'bald', headShape: 'round' };

test('a bald human head reaches its own top', () => {
  assert.ok(Math.abs(HeadReach.above(bald) + HeadProfile.of('round').top()) < 2);
});
test('tall hats, antennae and the ghost wisp reach higher than a bare head', () => {
  const bare = HeadReach.above(bald);
  for (const look of [{ headwear: 'witch-hat' }, { headwear: 'knight-helmet' }, { headwear: 'top-hat' }, { species: 'robot' }, { species: 'alien' }, { species: 'ghost' }] as const) {
    assert.ok(HeadReach.above({ ...bald, ...look }) > bare + 10, JSON.stringify(look));
  }
  assert.ok(HeadReach.above({ ...bald, headwear: 'witch-hat' }) > HeadReach.above({ ...bald, headwear: 'cap' }));
});
test('a floating creature rises by its hover plus its bob; the others stay on the ground', () => {
  assert.equal(Species.highestFloat('ghost'), 46 + 7);
  assert.equal(Species.highestFloat('human'), 0);
  for (let second = 0; second < 3; second += 0.1) assert.ok(-Species.lift('ghost', second).y <= Species.highestFloat('ghost') + 1e-9);
});
