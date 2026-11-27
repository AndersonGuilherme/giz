import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tourKeyAction, wrappedFocus } from '../../src/renderer/tour/tourKeys.ts';

const press = (code: string, fields: Partial<Parameters<typeof tourKeyAction>[0]> = {}) => ({ code, shift: false, control: false, inCard: true, ...fields });

test('Escape skips from anywhere; the arrows move only while the focus is in the card', () => {
  assert.equal(tourKeyAction(press('Escape', { inCard: false })), 'skip');
  assert.equal(tourKeyAction(press('ArrowRight')), 'next');
  assert.equal(tourKeyAction(press('ArrowLeft')), 'back');
  assert.equal(tourKeyAction(press('ArrowRight', { inCard: false })), 'none');
  assert.equal(tourKeyAction(press('Tab')), 'tab');
  assert.equal(tourKeyAction(press('KeyA')), 'none');
});

test('the page shortcuts under the tour (undo, redo) are blocked while it is open', () => {
  assert.equal(tourKeyAction(press('KeyZ', { control: true })), 'block');
  assert.equal(tourKeyAction(press('KeyZ', { control: true, shift: true, inCard: false })), 'block');
  assert.equal(tourKeyAction(press('KeyY', { control: true })), 'block');
  assert.equal(tourKeyAction(press('KeyZ')), 'none', 'a plain z is typing');
});

test('Tab goes round inside the card: past the last back to the first, Shift+Tab before the first to the last', () => {
  assert.equal(wrappedFocus(3, 2, false), 0);
  assert.equal(wrappedFocus(3, 0, true), 2);
  assert.equal(wrappedFocus(3, 1, false), null, 'inside: the browser moves it');
  assert.equal(wrappedFocus(3, -1, false), 0, 'the focus outside the card comes back to it');
  assert.equal(wrappedFocus(3, -1, true), 2);
  assert.equal(wrappedFocus(0, -1, false), null);
});
