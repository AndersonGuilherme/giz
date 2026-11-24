import type { Family, Font } from './Font.ts';

export type Fit = Readonly<{ lines: string[]; size: number; fits: boolean }>;

// Ported from motor/src/textFit.ts (without DOM): average width of a character in "em", a little loose.
// The motor uses 0.58 for text; the monospaced family has a fixed advance of 0.6 em. Display (Nunito 800–900 capitals
// with an outline) measures about 0.62–0.64 em at 800 and more at 900: 0.70 keeps a margin.
const CHARACTER_WIDTH_IN_EM: Readonly<Record<Family, number>> = { text: 0.58, mono: 0.6, display: 0.7 };
// A display word broken in the middle reads as a mistake: the letters shrink first, and a word that still needs breaking is reported.
const KEEPS_WORDS: Readonly<Record<Family, boolean>> = { text: false, mono: false, display: true };
// Display capitals much wider than the 0.70 average (Nunito 900, measured in the browser: M 0.88 em, W 1.13 em) count as
// more than one character, so a group heavy with them is not underestimated. Only widens: nothing counts as less than 1.
const WIDE_LETTERS_IN_EM: Readonly<Record<Family, Readonly<Record<string, number>>>> = { text: {}, mono: {}, display: { 'M': 0.9, 'W': 1.15 } };
const MINIMUM_CHARACTERS_PER_LINE = 4;
const SCALE_STEP = 0.04;
const STEPS_TO_MINIMUM = 10; // 1 − 10 × 0.04 = 0.6: the letters shrink down to 60% of the base size

// Not rounded down: whole texts compare the same as against the rounded value, and wide letters (fractional units) get
// the exact room.
function charactersPerLine(font: Font, size: number, maximumWidth: number): number {
  const characterWidth = size * CHARACTER_WIDTH_IN_EM[font.family()];
  return Math.max(MINIMUM_CHARACTERS_PER_LINE, maximumWidth / characterWidth);
}

/** How many average characters `text` takes in `family` (its length, plus the extra of the wide letters). */
export function characterUnits(text: string, family: Family): number {
  const wide = WIDE_LETTERS_IN_EM[family];
  const extra = [...text.toUpperCase()].reduce((sum, letter) => sum + Math.max(0, (wide[letter] ?? 0) / CHARACTER_WIDTH_IN_EM[family] - 1), 0);
  return text.length + extra;
}

type Units = (text: string) => number;

// A word longer than the line (URL, code) is broken into line-sized pieces.
function wordPieces(word: string, limit: number): string[] {
  const whole = Math.floor(limit);
  const count = Math.ceil(word.length / whole);
  return Array.from({ length: count }, (_empty, index) => word.slice(index * whole, (index + 1) * whole));
}

type LineRule = Readonly<{ limit: number; units: Units }>;

function append(lines: string[], piece: string, rule: LineRule): string[] {
  const last = lines.at(-1);
  if (last === undefined || rule.units(`${last} ${piece}`) > rule.limit) return [...lines, piece];
  return [...lines.slice(0, -1), `${last} ${piece}`];
}

function wrapParagraph(paragraph: string, rule: LineRule): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  const pieces = words.flatMap((word) => wordPieces(word, rule.limit));
  if (pieces.length === 0) return [''];
  return pieces.reduce<string[]>((lines, piece) => append(lines, piece, rule), []);
}

function wrap(text: string, rule: LineRule): string[] {
  const paragraphs = text.trim().split('\n');
  return paragraphs.flatMap((paragraph) => wrapParagraph(paragraph, rule));
}

type FitRequest = Readonly<{ text: string; font: Font; maximumWidth: number }>;

function fitAtScale({ text, font, maximumWidth }: FitRequest, step: number): Fit {
  const size = Math.round(font.baseSize() * (1 - step * SCALE_STEP) * 100) / 100;
  const limit = charactersPerLine(font, size, maximumWidth);
  const units: Units = (piece) => characterUnits(piece, font.family());
  const lines = wrap(text, { limit, units });
  const wordBroken = KEEPS_WORDS[font.family()] && text.split(/\s+/).some((word) => units(word) > limit);
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
