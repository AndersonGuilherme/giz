import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftProblems, emptyDraft, ideaOf, toggled } from '../../src/renderer/idea/ideaDraft.ts';
import { IDLE, reduceGeneration } from '../../src/renderer/idea/generation.ts';

test('a new draft asks for the theme, the audience and the tone; the duration has the core limits', () => {
  const draft = emptyDraft('pt-BR');
  assert.deepEqual(draftProblems(draft), ['theme', 'audience', 'tone']);
  const filled = { ...draft, theme: 'Gatos', audience: 'jovens', tone: 'leve' };
  assert.deepEqual(draftProblems(filled), []);
  assert.deepEqual(draftProblems({ ...filled, targetSeconds: 5 }), ['targetSeconds']);
  assert.deepEqual(draftProblems({ ...filled, targetSeconds: 901 }), ['targetSeconds']);
  assert.deepEqual(draftProblems({ ...filled, format: 'lesson', cast: ['lia', 'teo', 'bia'] }), ['cast']);
});

test('the idea sent has trimmed texts and leaves the empty lists out', () => {
  const draft = { ...emptyDraft('en'), theme: '  Gatos ', audience: 'jovens', tone: 'leve' };
  assert.deepEqual(ideaOf(draft), { format: 'story', aspect: '9:16', targetSeconds: 60, theme: 'Gatos', audience: 'jovens', tone: 'leve', language: 'en' });
  assert.deepEqual(ideaOf({ ...draft, cast: ['bia'], scenes: ['street'] }).cast, ['bia']);
  assert.deepEqual(toggled(toggled(['bia'], 'caio'), 'bia'), ['caio']);
});

test('the generation goes estimate → confirm → running with progress; progress before the start is ignored', () => {
  const estimate = { provider: 'anthropic', model: 'm', firstCall: 0.1, maximum: 1, calls: 4 };
  let state = reduceGeneration(IDLE, { type: 'estimate' });
  assert.equal(reduceGeneration(state, { type: 'start' }), state, 'no start without the confirmation');
  state = reduceGeneration(state, { type: 'estimated', estimate });
  assert.deepEqual(state, { status: 'confirm', estimate });
  assert.equal(reduceGeneration(state, { type: 'progress', progress: { call: 1, most: 4 } }), state);
  state = reduceGeneration(state, { type: 'start' });
  state = reduceGeneration(state, { type: 'progress', progress: { call: 2, most: 4 } });
  assert.deepEqual(state, { status: 'running', estimate, progress: { call: 2, most: 4 } });
  assert.deepEqual(reduceGeneration(state, { type: 'close' }), IDLE);
});
