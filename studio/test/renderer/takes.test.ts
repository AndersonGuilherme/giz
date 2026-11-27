import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dropped, type Take } from '../../src/renderer/media/takes.ts';

function fakeTake(state: 'recording' | 'inactive' = 'recording') {
  const stopped: string[] = [];
  const track = (kind: string) => ({ stop: () => stopped.push(kind) });
  const recorder = { state, stop: () => stopped.push('recorder') };
  const take = { recorder, chunks: [new Blob(['x'])], stream: { getTracks: () => [track('audio')] } } as unknown as Take;
  return { take, stopped };
}

test('leaving the Voices screen mid-take: the microphone track and the recorder stop, and the take is thrown away', () => {
  const { take, stopped } = fakeTake();
  dropped(take);
  assert.deepEqual(stopped.sort(), ['audio', 'recorder']);
  assert.equal(take.chunks.length, 0, 'nothing of the take is kept');
});

test('a recorder already stopped is not stopped again (it would throw); its tracks still stop', () => {
  const { take, stopped } = fakeTake('inactive');
  dropped(take);
  assert.deepEqual(stopped, ['audio']);
});
