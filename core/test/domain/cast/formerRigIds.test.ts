import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentRigId } from '../../../src/domain/cast/formerRigIds.ts';

test('the rig id from before the rename to Gizzycera (giz) is gizzy today; any other id stays itself', () => {
  assert.equal(currentRigId('giz'), 'gizzy');
  assert.equal(currentRigId('gizzy'), 'gizzy');
  assert.equal(currentRigId('lia-style'), 'lia-style');
  assert.equal(currentRigId('constructor'), 'constructor', 'no inherited name counts as a former id');
});
