import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterState } from '../../../src/domain/character/CharacterState.ts';

test('keeps what defines the character in the frame', () => {
  const state = CharacterState.of({
    pose: 'wave', expression: 'happy', look: 'camera', speaking: true, viseme: 'A', opening: 0.8, blink: 0,
    body: { y: -1, rotation: 0.2, scale: 1.004 },
  });
  assert.equal(state.pose(), 'wave');
  assert.equal(state.expression(), 'happy');
  assert.equal(state.gaze(), 'camera');
  assert.ok(state.isSpeaking());
  assert.equal(state.viseme(), 'A');
  assert.equal(state.opening(), 0.8);
  assert.equal(state.eyeClosure(), 0);
  assert.equal(state.bodyOffset().y, -1);
});
test('without a video time (sheets, stills) the state sits at second 0', () => {
  const state = CharacterState.of({
    pose: 'wave', expression: 'happy', look: 'camera', speaking: true, viseme: 'A', opening: 0.8, blink: 0, body: { y: 0, rotation: 0, scale: 1 },
  });
  assert.equal(state.videoSeconds(), 0);
});
