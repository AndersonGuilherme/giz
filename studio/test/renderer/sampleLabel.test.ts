import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleLabel, voicesBusyAfter } from '../../src/renderer/cast/sampleLabel.ts';

test('a sample asked while the voices are being made says it waits for them; otherwise "ouvindo" or "ouvir"', () => {
  assert.equal(sampleLabel({ sampling: true, voicesBusy: true }), 'cast.sampleWaiting');
  assert.equal(sampleLabel({ sampling: true, voicesBusy: false }), 'cast.sampling');
  assert.equal(sampleLabel({ sampling: false, voicesBusy: true }), 'cast.listen');
});

test('the voices are busy from any line of a job until it ends', () => {
  assert.equal(voicesBusyAfter({ done: 1, total: 3, lineId: '1' }), true);
  assert.equal(voicesBusyAfter({ done: 3, total: 3, lineId: '3', ended: true }), false);
});
