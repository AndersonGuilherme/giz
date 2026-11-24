import type { Expression, Pose } from '../cast/PoseAndExpression.ts';
import type { Viseme } from '../speech/Visemes.ts';
import { Beats } from './Beats.ts';
import type { StateJson, SegmentJson } from './VideoProps.ts';

/** A character in a frame of a segment; `relative` is the frame since the start of the segment. */
export type InSegment = Readonly<{ segment: SegmentJson; id: string; relative: number }>;

export type MouthState = Readonly<{ speaking: boolean; viseme: Viseme; opening: number }>;

const CLOSED_MOUTH: MouthState = { speaking: false, viseme: 'X', opening: 0 };
const AFTER_EVERYTHING = Number.POSITIVE_INFINITY;

function line(local: InSegment): boolean {
  return local.segment.speaker === local.id;
}

function changeUntil<Value>(local: InSegment, field: 'pose' | 'expression'): Value | undefined {
  const beats = Beats.fromJson(local.segment.beats);
  const beat = beats.lastUntil(field, local.relative);
  return beat?.changes[field] as Value | undefined;
}

/** Pose, expression and look in the frame: beats change the speaker pose and expression from their frame on. */
export function stateInSegment(local: InSegment): StateJson | undefined {
  const base = local.segment.states[local.id];
  if (!base || !line(local)) return base;
  const pose = changeUntil<Pose>(local, 'pose') ?? base.pose;
  const expression = changeUntil<Expression>(local, 'expression') ?? base.expression;
  return { ...base, pose, expression };
}

function visemeAt(segment: SegmentJson, relative: number): Viseme {
  const visemes = segment.visemes ?? '';
  return (visemes[relative] ?? 'X') as Viseme;
}

function openingAt(segment: SegmentJson, relative: number): number {
  const envelope = segment.envelope ?? [];
  return envelope[relative] ?? 0;
}

/** Only the speaker moves the mouth, during the line (not in the hold nor in the breather). */
export function mouthInSegment(local: InSegment): MouthState {
  const { segment, relative } = local;
  if (!line(local) || relative >= segment.lineDuration) return CLOSED_MOUTH;
  return { speaking: true, viseme: visemeAt(segment, relative), opening: openingAt(segment, relative) };
}

// Where (absolute frame) a beat of this segment set the current pose; `undefined` if the pose came from the start of the segment.
function startFromBeat(local: InSegment): number | undefined {
  if (!line(local)) return undefined;
  const beats = Beats.fromJson(local.segment.beats);
  const beat = beats.lastUntil('pose', local.relative);
  return beat && local.segment.start + beat.frame;
}

// The same character at the end of the previous segment, if it ended in the same pose.
function inSamePoseBefore(previous: SegmentJson | undefined, local: InSegment): InSegment | undefined {
  if (!previous) return undefined;
  const inPrevious = { segment: previous, id: local.id, relative: AFTER_EVERYTHING };
  const samePose = stateInSegment(inPrevious)?.pose === stateInSegment(local)?.pose;
  return samePose ? inPrevious : undefined;
}

/**
 * The (absolute) frame where the current pose started: at the beat that set it or at the start of the segment. If the
 * previous segment ended in the same pose, it continues and the gesture does not restart.
 */
export function poseStart(segments: readonly SegmentJson[], index: number, local: InSegment): number {
  const fromBeat = startFromBeat(local);
  if (fromBeat !== undefined) return fromBeat;
  const inPrevious = inSamePoseBefore(segments[index - 1], local);
  if (!inPrevious) return local.segment.start;
  return poseStart(segments, index - 1, inPrevious);
}
