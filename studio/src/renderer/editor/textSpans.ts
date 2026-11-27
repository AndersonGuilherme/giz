/** A piece of a line's text: plain, or a `[span]` with its number (counted from 0), which fires the beat of that number. */
export type TextPiece = Readonly<{ text: string; span: number | null }>;

const SPAN = /\[([^\]]*)\]/g;

/** The text cut into plain pieces and `[span]` pieces, in order (the brackets stay in the span's text). */
export function piecesOf(text: string): readonly TextPiece[] {
  const pieces: TextPiece[] = [];
  let last = 0;
  let span = 0;
  for (const found of text.matchAll(SPAN)) {
    pieces.push({ text: text.slice(last, found.index), span: null }, { text: found[0], span: span++ });
    last = found.index + found[0].length;
  }
  pieces.push({ text: text.slice(last), span: null });
  return pieces.filter((piece) => piece.text !== '');
}

/** How many `[spans]` the text has: as many beats as that (core's check refuses a different count). */
export const spanCount = (text: string): number => [...text.matchAll(SPAN)].length;

type Beat = Readonly<Record<string, unknown>>;

/** The beats made as many as the spans: the missing ones empty, the extra ones gone. */
export function fittedBeats(beats: readonly Beat[], spans: number): readonly Beat[] {
  return Array.from({ length: spans }, (_empty, at) => beats[at] ?? {});
}
