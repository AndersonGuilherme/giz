import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLOSED_TOUR, reduceTour, shouldStart, type TourState } from '../../src/renderer/tour/tourProgress.ts';
import { SCRIPT_TOUR } from '../../src/renderer/tour/scriptTour.ts';
import { hasMessage, translator } from '../../src/shared/i18n/translate.ts';

const steps = SCRIPT_TOUR.steps.length;
const run = (state: TourState, ...events: Parameters<typeof reduceTour>[1][]) => events.reduce(reduceTour, state);

test('the tour starts on its first step, goes forward and back, and never past its ends', () => {
  const started = run(CLOSED_TOUR, { type: 'start', steps });
  assert.deepEqual(started, { open: true, step: 0, steps, seen: false });
  assert.equal(run(started, { type: 'back' }).step, 0);
  assert.equal(run(started, { type: 'next' }, { type: 'next' }, { type: 'back' }).step, 1);
});

test('"next" on the last step finishes; skipping finishes at once; both say the tour was seen', () => {
  const last = run(CLOSED_TOUR, { type: 'start', steps }, ...Array.from({ length: steps - 1 }, () => ({ type: 'next' as const })));
  assert.equal(last.step, steps - 1);
  assert.deepEqual(run(last, { type: 'next' }), { ...CLOSED_TOUR, seen: true });
  assert.deepEqual(run(CLOSED_TOUR, { type: 'start', steps }, { type: 'next' }, { type: 'skip' }), { ...CLOSED_TOUR, seen: true });
  assert.equal(run(CLOSED_TOUR, { type: 'next' }), CLOSED_TOUR, 'a closed tour ignores the buttons');
});

test('it starts by itself only the first time: when not seen yet and not already shown in this window', () => {
  assert.equal(shouldStart('script', [], false), true);
  assert.equal(shouldStart('script', ['script'], false), false);
  assert.equal(shouldStart('script', [], true), false);
});

test('the script tour has the nine steps of the brief, with a title and a text each, and the targets of the editor', () => {
  assert.equal(SCRIPT_TOUR.id, 'script');
  assert.equal(steps, 9);
  assert.equal(new Set(SCRIPT_TOUR.steps.map(({ id }) => id)).size, 9);
  for (const step of SCRIPT_TOUR.steps) {
    assert.match(step.title, /^tour\.script\./);
    assert.match(step.text, /^tour\.script\./);
  }
  const keys = SCRIPT_TOUR.steps.flatMap(({ title, text, absent }) => [title, text, absent].filter((each) => each !== undefined));
  for (const key of keys) assert.ok(hasMessage(key) && translator('en')(key) !== key, key);
  assert.deepEqual(SCRIPT_TOUR.steps.map(({ target }) => target ?? null), [null, 'add-line', 'speaker', 'text', 'scene', 'line-row', 'check', null, null]);
});
