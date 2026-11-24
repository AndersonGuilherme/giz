import type { Family, Font } from './Font.ts';

export type Fit = Readonly<{ lines: string[]; size: number; fits: boolean }>;

// Ported from motor/src/textFit.ts (without DOM): average width of a character in "em", a little loose.
// The motor uses 0.58 for text; the monospaced family has a fixed advance of 0.6 em. Display (Nunito 800–900 capitals
// with an outline) measures about 0.62–0.64 em at 800 and more at 900: 0.70 keeps a margin.
const CHARACTER_WIDTH_IN_EM: Readonly<Record<Family, number>> = { text: 0.58, mono: 0.6, display: 0.7 };
// A display word broken in the middle reads as a mistake: the letters shrink first, and a word that still needs breaking is reported.
const KEEPS_WORDS: Readonly<Record<Family, boolean>> = { text: false, mono: false, display: true };
const MINIMUM_CHARACTERS_PER_LINE = 4;
const SCALE_STEP = 0.04;
const STEPS_TO_MINIMUM = 10; // 1 − 10 × 0.04 = 0.6: the letters shrink down to 60% of the base size

function charactersPerLine(font: Font, size: number, maximumWidth: number): number {
  const characterWidth = size * CHARACTER_WIDTH_IN_EM[font.family()];
  return Math.max(MINIMUM_CHARACTERS_PER_LINE, Math.floor(maximumWidth / characterWidth));
}

// A word longer than the line (URL, code) is broken into line-sized pieces.
function wordPieces(word: string, limit: number): string[] {
  const count = Math.ceil(word.length / limit);
  return Array.from({ length: count }, (_empty, index) => word.slice(index * limit, (index + 1) * limit));
}

function append(lines: string[], piece: string, limit: number): string[] {
  const last = lines.at(-1);
  if (last === undefined || last.length + 1 + piece.length > limit) return [...lines, piece];
  return [...lines.slice(0, -1), `${last} ${piece}`];
}

function wrapParagraph(paragraph: string, limit: number): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  const pieces = words.flatMap((word) => wordPieces(word, limit));
  if (pieces.length === 0) return [''];
  return pieces.reduce<string[]>((lines, piece) => append(lines, piece, limit), []);
}

function wrap(text: string, limit: number): string[] {
  const paragraphs = text.trim().split('\n');
  return paragraphs.flatMap((paragraph) => wrapParagraph(paragraph, limit));
}

type FitRequest = Readonly<{ text: string; font: Font; maximumWidth: number }>;

function fitAtScale({ text, font, maximumWidth }: FitRequest, step: number): Fit {
  const size = Math.round(font.baseSize() * (1 - step * SCALE_STEP) * 100) / 100;
  const limit = charactersPerLine(font, size, maximumWidth);
  const lines = wrap(text, limit);
  const wordBroken = KEEPS_WORDS[font.family()] && text.split(/\s+/).some((word) => word.length > limit);
  return { lines, size, fits: lines.length <= font.maximumLines() && !wordBroken };
}

/** Estimates the lines of a text and shrinks the letters until it fits; below 60% of the base size, it gives up (`fits: false`). */
export class TextFit {
  static measure(text: string, font: Font, maximumWidth: number): Fit {
    const steps = Array.from({ length: STEPS_TO_MINIMUM + 1 }, (_empty, step) => step);
    const attempts = steps.map((step) => fitAtScale({ text, font, maximumWidth }, step));
    const firstThatFits = attempts.find((fit) => fit.fits);
    return firstThatFits ?? attempts[STEPS_TO_MINIMUM];
  }
}
