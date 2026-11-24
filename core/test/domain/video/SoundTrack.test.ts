import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SoundTrack } from '../../../src/domain/video/SoundTrack.ts';
import { VideoClock } from '../../../src/domain/video/VideoClock.ts';
import { props, segment } from './videoFixtures.ts';

const video = props([segment({ start: 0, totalDuration: 50 }), segment({ lineId: '2', start: 50, totalDuration: 40, audio: 'voice/2.wav' }), segment({ lineId: '3', start: 90, audio: undefined })], {
  soundEffects: [{ frame: 50, sound: 'whoosh' }, { frame: 120, sound: 'tick' }],
});
const track = () => SoundTrack.of(video, VideoClock.of(video.totalFrames));

test('each voiced segment plays its audio from its start, moved by the lead-in', () => {
  assert.deepEqual(track().voices(), [
    { file: 'voice/1.wav', from: 15, duration: 50, volume: 1 },
    { file: 'voice/2.wav', from: 65, duration: 40, volume: 1 },
  ]);
});
test('each sound effect plays its file from the public sounds folder, at the motor volume, for up to 3 s', () => {
  assert.deepEqual(track().effects(), [
    { file: 'sounds/whoosh.wav', from: 65, duration: 90, volume: 0.18 },
    // 15 + 120 = 135; the video ends at 15 + 140 + 30 = 185
    { file: 'sounds/tick.wav', from: 135, duration: 50, volume: 0.25 },
  ]);
});
test('every sound of the script has a file and a volume', () => {
  const all = ['pop', 'whoosh', 'ding', 'dings', 'error', 'success', 'tick'] as const;
  const many = props([segment({})], { soundEffects: all.map((sound) => ({ frame: 0, sound })) });
  const effects = SoundTrack.of(many, VideoClock.of(many.totalFrames)).effects();
  assert.deepEqual(effects.map((effect) => effect.file), all.map((sound) => `sounds/${sound}.wav`));
  assert.ok(effects.every((effect) => effect.volume > 0 && effect.volume < 1));
});
