import { Box, type Rectangle } from '../layout/Box.ts';
import { Font } from '../layout/Font.ts';
import { TextFit, type Fit } from '../layout/TextFit.ts';
import type { CaptionStyle, Format } from '../project/Project.ts';
import { Words } from '../speech/Words.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { BlockCaption } from './BlockCaption.ts';
import { ACTIVE_WORD_SCALE, WORD_CAPTION_FONT, WordCaption } from './WordCaption.ts';

/** What the `check` sees of the caption of a line; the renderer draws from the same layout object. */
export type CaptionLayout = Readonly<{ box: (text: string, aspect: AspectRatio, format: Format) => Box }>;

type ByAspect<T> = Readonly<{ vertical: T; horizontal: T }>;
const pick = <T>(table: Readonly<Record<Format, ByAspect<T>>>, aspect: AspectRatio, format: Format): T =>
  (aspect.vertical() ? table[format].vertical : table[format].horizontal);

// Words, one line. Story: centered in the lower third (9:16 → y 1330–1427, above the Reels/Shorts buttons; 16:9 →
// y 780–877, as in the reference videos). Lesson: in the middle of the caption area under the content.
const WORD_HEIGHT = Math.round(WORD_CAPTION_FONT.maximumHeight() * ACTIVE_WORD_SCALE);
const WORD_PLACES: Readonly<Record<Format, ByAspect<Rectangle>>> = {
  story: { vertical: { x: 86, y: 1330, width: 908, height: WORD_HEIGHT }, horizontal: { x: 360, y: 780, width: 1200, height: WORD_HEIGHT } },
  lesson: { vertical: { x: 86, y: 1269, width: 908, height: WORD_HEIGHT }, horizontal: { x: 600, y: 877, width: 1224, height: WORD_HEIGHT } },
};

/** Word-by-word captions. */
export const WORD_CAPTIONS = {
  rectangle: (aspect: AspectRatio, format: Format): Rectangle => pick(WORD_PLACES, aspect, format),
  caption: (words: Words, aspect: AspectRatio, format: Format): WordCaption => WordCaption.of(words, WORD_CAPTIONS.rectangle(aspect, format).width),
  box: (text: string, aspect: AspectRatio, format: Format): Box => {
    const fitted = WORD_CAPTIONS.caption(Words.fromText(text), aspect, format);
    return Box.fitted('legenda', WORD_CAPTIONS.rectangle(aspect, format), { fits: fitted.fits() });
  },
} as const;

// Blocks, in a dark pill with padding, against the base of the safe area. Lesson: 16:9 under the content column
// (x 600–1824, y 826–1026), 9:16 across the safe area under the content (y 1138–1498). Story: centered.
type BlockPlace = Readonly<{ rectangle: Rectangle; font: Font }>;
const BLOCK_VERTICAL: BlockPlace = { rectangle: { x: 86, y: 1138, width: 908, height: 360 }, font: Font.of({ family: 'text', size: 48, lineHeight: 1.25, maximumLines: 5 }) };
const BLOCK_FONT_HORIZONTAL = Font.of({ family: 'text', size: 40, lineHeight: 1.25, maximumLines: 3 });
const BLOCK_PLACES: Readonly<Record<Format, ByAspect<BlockPlace>>> = {
  story: { vertical: BLOCK_VERTICAL, horizontal: { rectangle: { x: 360, y: 826, width: 1200, height: 200 }, font: BLOCK_FONT_HORIZONTAL } },
  lesson: { vertical: BLOCK_VERTICAL, horizontal: { rectangle: { x: 600, y: 826, width: 1224, height: 200 }, font: BLOCK_FONT_HORIZONTAL } },
};
const PILL_PADDING = { x: 30, y: 14 } as const;

/** A block in its pill: the lines and size `TextFit` chose, and the height of the pill. */
export type Pill = Readonly<{ fit: Fit; font: Font; height: number }>;

/** Block captions, as in the motor: up to 90 characters per block. */
export const BLOCK_CAPTIONS = {
  maximumCharacters: 90,
  padding: PILL_PADDING,
  rectangle: (aspect: AspectRatio, format: Format): Rectangle => pick(BLOCK_PLACES, aspect, format).rectangle,
  caption: (words: Words): BlockCaption => BlockCaption.of(words, BLOCK_CAPTIONS.maximumCharacters),
  pill: (text: string, aspect: AspectRatio, format: Format): Pill => {
    const { rectangle, font } = pick(BLOCK_PLACES, aspect, format);
    const fit = TextFit.measure(text, font, rectangle.width - 2 * PILL_PADDING.x);
    return { fit, font, height: Math.ceil(fit.lines.length * fit.size * font.lineHeight() + 2 * PILL_PADDING.y) };
  },
  /** The blocks of a line as the renderer draws them: from its words (beat brackets removed, spaces collapsed). */
  blocks: (text: string): string[] => BLOCK_CAPTIONS.caption(Words.fromText(text)).cues().map((cue) => cue.text),
  box: (text: string, aspect: AspectRatio, format: Format): Box => {
    const fits = BLOCK_CAPTIONS.blocks(text).every((block) => BLOCK_CAPTIONS.pill(block, aspect, format).fit.fits);
    return Box.fitted('legenda', BLOCK_CAPTIONS.rectangle(aspect, format), { fits });
  },
} as const;

/** The caption layout of each style; where it goes depends on the format. `check` and the renderer both pick from here. */
export const CAPTION_LAYOUTS = { words: WORD_CAPTIONS, blocks: BLOCK_CAPTIONS } as const satisfies Readonly<Record<CaptionStyle, CaptionLayout>>;
