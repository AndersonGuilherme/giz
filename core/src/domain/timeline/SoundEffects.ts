import type { Line } from '../script/Line.ts';
import { Fps } from '../values/Time.ts';
import { Beats } from './Beats.ts';
import type { SoundEffectJson, SegmentJson } from './VideoProps.ts';
import type { LineScene } from './SceneSequence.ts';

// A scene change (except the first) makes a "whoosh" at the start of the line.
function fromSceneChange(scene: LineScene, start: number): SoundEffectJson[] {
  return scene.opened && scene.key > 0 ? [{ frame: start, sound: 'whoosh' }] : [];
}

function fromLine(line: Line, start: number): SoundEffectJson[] {
  const sound = line.sfx();
  return sound ? [{ frame: start, sound }] : [];
}

// A tick every second, only in the explicit hold (the challenge one); the reading hold is silent.
function fromHold(line: Line, segment: SegmentJson): SoundEffectJson[] {
  const seconds = line.holdAfter() ? (segment.holdAfter?.seconds ?? 0) : 0;
  const lineEnd = segment.start + segment.lineDuration;
  const howMany = Math.ceil(seconds);
  return [...Array(howMany).keys()].map((second) => ({ frame: lineEnd + second * Fps.DEFAULT.value(), sound: 'tick' }));
}

/** The sounds of a segment, in absolute frames, in the motor order: scene change, line, beats and hold. */
export function segmentSoundEffects(line: Line, segment: SegmentJson, scene: LineScene): SoundEffectJson[] {
  const beats = Beats.fromJson(segment.beats);
  return [...fromSceneChange(scene, segment.start), ...fromLine(line, segment.start), ...beats.soundEffects(segment.start), ...fromHold(line, segment)];
}
