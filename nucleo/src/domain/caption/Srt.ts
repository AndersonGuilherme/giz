import type { CharacterJson, SegmentJson, VideoProps } from '../timeline/VideoProps.ts';
import { BLOCK_CAPTIONS } from './captionLayouts.ts';
import { captionWords } from './captionWords.ts';

type Entry = Readonly<{ text: string; start: number; end: number }>;

const pad = (number: number, width = 2): string => String(number).padStart(width, '0');

// hh:mm:ss,mmm, as in the motor's `toSrt`.
function timestamp(seconds: number): string {
  const milliseconds = Math.round(seconds * 1000);
  const hours = pad(Math.floor(milliseconds / 3_600_000));
  const minutes = pad(Math.floor(milliseconds / 60_000) % 60);
  return `${hours}:${minutes}:${pad(Math.floor(milliseconds / 1000) % 60)},${pad(milliseconds % 1000, 3)}`;
}

// The name goes before the text only for characters with a body (a dialogue); the narrator speaks without a name.
function prefixOf(speaker: string, cast: readonly CharacterJson[]): string {
  const character = cast.find((member) => member.id === speaker);
  return character?.rig === undefined ? '' : `${character.name}: `;
}

function segmentEntries(segment: SegmentJson, props: VideoProps): Entry[] {
  const offset = segment.start / props.fps;
  const prefix = prefixOf(segment.speaker, props.cast);
  const caption = BLOCK_CAPTIONS.caption(captionWords(segment.words, segment.lineDuration));
  return caption.cues().map((cue) => ({ text: `${prefix}${cue.text}`, start: offset + cue.start.value(), end: offset + cue.end.value() }));
}

/**
 * The `.srt` (YouTube and any player). Both formats use sentence blocks (as the lesson caption): a 3-word group per cue
 * would be unreadable in a player. Each block goes from the real start of its first word to the start of the next block
 * (the last one, to the end of its last word).
 */
export function srtOf(props: VideoProps): string {
  const entries = props.segments.flatMap((segment) => segmentEntries(segment, props));
  return entries.map((entry, index) => `${index + 1}\n${timestamp(entry.start)} --> ${timestamp(entry.end)}\n${entry.text}\n`).join('\n');
}
