/** "1:03" for 63 seconds of frames at `fps` (whole seconds, rounded down). */
export function clockText(frames: number, fps: number): string {
  const seconds = Math.max(0, Math.floor(frames / fps));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** "1:03" for a length in seconds (rounded to the nearest second). */
export const lengthText = (seconds: number): string => clockText(Math.round(seconds), 1);

/** The mark playing at `frame`: the last one that starts at or before it (the first one during the lead-in). */
export function markAt<Mark extends Readonly<{ frame: number }>>(marks: readonly Mark[], frame: number): Mark | undefined {
  return marks.filter((mark) => mark.frame <= frame).at(-1) ?? marks[0];
}
