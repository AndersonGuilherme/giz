import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Timeline } from '../../../src/domain/timeline/Timeline.ts';
import type { VideoProps, SegmentJson } from '../../../src/domain/timeline/VideoProps.ts';
import { CharacterId } from '../../../src/domain/values/CharacterId.ts';
import { Frame } from '../../../src/domain/values/Time.ts';

const ana = CharacterId.of('ana');
const teo = CharacterId.of('teo');

function segment(data: Partial<SegmentJson>): SegmentJson {
  return {
    lineId: '1', speaker: 'ana', chapter: 1, start: 0, lineDuration: 10, totalDuration: 20, scene: { type: 'talk' }, sceneKey: 0, words: [], beats: [],
    states: { ana: { pose: 'explain', expression: 'happy', look: 'other' }, teo: { pose: 'think', expression: 'skeptical', look: 'other' } },
    audio: 'voice/1.wav', envelope: [0, 0.2, 0.4, 0.6, 0.8, 1, 0.8, 0.6, 0.4, 0.2], visemes: 'XMAEIOUFCA',
    ...data,
  };
}

function line(segments: SegmentJson[]): Timeline {
  const props: VideoProps = {
    fps: 30, width: 1080, height: 1920, language: 'pt-BR', format: 'story', captionStyle: 'words', title: 'T', chapters: ['A'],
    totalFrames: segments.reduce((sum, current) => sum + current.totalDuration, 0), segments, cast: [], soundEffects: [],
  };
  return Timeline.of(props);
}

test('the speaker moves the mouth by the frame viseme and envelope', () => {
  const state = line([segment({})]).stateOf(ana, Frame.of(4));
  assert.equal(state.isSpeaking(), true);
  assert.equal(state.viseme(), 'I');
  assert.equal(state.opening(), 0.8);
  assert.equal(state.pose(), 'explain');
  assert.equal(state.expression(), 'happy');
});

test('during the hold after the line the mouth is at rest', () => {
  const state = line([segment({})]).stateOf(ana, Frame.of(15));
  assert.equal(state.isSpeaking(), false);
  assert.equal(state.viseme(), 'X');
  assert.equal(state.opening(), 0);
});

test('a listener uses the listener state and does not speak', () => {
  const state = line([segment({})]).stateOf(teo, Frame.of(4));
  assert.equal(state.isSpeaking(), false);
  assert.equal(state.pose(), 'think');
  assert.equal(state.expression(), 'skeptical');
});

test('the beat changes the speaker expression and pose from its frame on', () => {
  const timeline = line([segment({ beats: [{ frame: 5, changes: { expression: 'surprised', pose: 'point' } }] })]);
  assert.equal(timeline.stateOf(ana, Frame.of(4)).expression(), 'happy');
  const later = timeline.stateOf(ana, Frame.of(5));
  assert.equal(later.expression(), 'surprised');
  assert.equal(later.pose(), 'point');
  assert.equal(timeline.stateOf(teo, Frame.of(6)).expression(), 'skeptical');
});

test('the frame falls in the right segment', () => {
  const second = segment({ lineId: '2', speaker: 'teo', start: 20, states: { ana: { pose: 'neutral', expression: 'neutral', look: 'other' }, teo: { pose: 'wave', expression: 'happy', look: 'camera' } } });
  const timeline = line([segment({}), second]);
  assert.equal(timeline.stateOf(teo, Frame.of(22)).isSpeaking(), true);
  assert.equal(timeline.stateOf(teo, Frame.of(22)).gaze(), 'camera');
  assert.equal(timeline.stateOf(ana, Frame.of(22)).isSpeaking(), false);
});

test('the pose gesture does not restart when the pose continues into the next line', () => {
  const second = segment({ lineId: '2', start: 20 });
  const continues = line([segment({}), second]).stateOf(ana, Frame.of(21));
  const restarts = line([segment({ states: { ana: { pose: 'neutral', expression: 'happy', look: 'other' } } }), second]).stateOf(ana, Frame.of(21));
  assert.notDeepEqual(continues.bodyOffset(), restarts.bodyOffset());
});

test('whoever has no body (the narrator) has no state', () => {
  assert.throws(() => line([segment({ speaker: 'narrator' })]).stateOf(CharacterId.NARRATOR, Frame.of(2)), /narrator.*sem estado/);
});
