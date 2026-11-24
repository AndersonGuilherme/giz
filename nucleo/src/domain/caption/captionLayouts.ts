import { Box, type Rectangle } from '../layout/Box.ts';
import { Font } from '../layout/Font.ts';
import { TextFit, type Fit } from '../layout/TextFit.ts';
import type { Format } from '../project/Project.ts';
import { Words } from '../speech/Words.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { BlockCaption } from './BlockCaption.ts';
import { ACTIVE_WORD_SCALE, WORD_CAPTION_FONT, WordCaption } from './WordCaption.ts';

/** What the `check` sees of the caption of a line; the renderer draws from the same layout object. */
export type CaptionLayout = Readonly<{ box: (text: string, aspect: AspectRatio) => Box }>;

const byAspect = <T>(aspect: AspectRatio, vertical: T, horizontal: T): T => (aspect.vertical() ? vertical : horizontal);

// Story: one line centered in the lower third, inside the safe area (9:16 → y 1330–1427, above the Reels/Shorts
// buttons; 16:9 → y 780–877, as in the reference videos). The height leaves room for the grown spoken word.
const WORD_HEIGHT = Math.round(WORD_CAPTION_FONT.maximumHeight() * ACTIVE_WORD_SCALE);
const WORD_VERTICAL: Rectangle = { x: 86, y: 1330, width: 908, height: WORD_HEIGHT };
const WORD_HORIZONTAL: Rectangle = { x: 360, y: 780, width: 1200, height: WORD_HEIGHT };

/** Word-by-word captions (story). */
export const WORD_CAPTIONS = {
  rectangle: (aspect: AspectRatio): Rectangle => byAspect(aspect, WORD_VERTICAL, WORD_HORIZONTAL),
  caption: (words: Words, aspect: AspectRatio): WordCaption => WordCaption.of(words, WORD_CAPTIONS.rectangle(aspect).width),
  box: (text: string, aspect: AspectRatio): Box => {
    const fitted = WORD_CAPTIONS.caption(Words.fromText(text), aspect);
    return Box.fitted('legenda', WORD_CAPTIONS.rectangle(aspect), { fits: fitted.fits() });
  },
} as const;

// Lesson: against the base of the safe area; 16:9 under the content column (x 600–1824, y 826–1026), 9:16 across the
// safe area under the content (y 1138–1498). The text sits in a dark pill with padding, like the motor's caption.
const BLOCK_VERTICAL = { rectangle: { x: 86, y: 1138, width: 908, height: 360 }, font: Font.of({ family: 'text', size: 48, lineHeight: 1.25, maximumLines: 5 }) };
const BLOCK_HORIZONTAL = { rectangle: { x: 600, y: 826, width: 1224, height: 200 }, font: Font.of({ family: 'text', size: 40, lineHeight: 1.25, maximumLines: 3 }) };
const PILL_PADDING = { x: 30, y: 14 } as const;

/** A block in its pill: the lines and size `TextFit` chose, and the height of the pill. */
export type Pill = Readonly<{ fit: Fit; font: Font; height: number }>;

/** Block captions (lesson), as in the motor: up to 90 characters per block. */
export const BLOCK_CAPTIONS = {
  maximumCharacters: 90,
  padding: PILL_PADDING,
  rectangle: (aspect: AspectRatio): Rectangle => byAspect(aspect, BLOCK_VERTICAL, BLOCK_HORIZONTAL).rectangle,
  caption: (words: Words): BlockCaption => BlockCaption.of(words, BLOCK_CAPTIONS.maximumCharacters),
  pill: (text: string, aspect: AspectRatio): Pill => {
    const { rectangle, font } = byAspect(aspect, BLOCK_VERTICAL, BLOCK_HORIZONTAL);
    const fit = TextFit.measure(text, font, rectangle.width - 2 * PILL_PADDING.x);
    return { fit, font, height: Math.ceil(fit.lines.length * fit.size * font.lineHeight() + 2 * PILL_PADDING.y) };
  },
  box: (text: string, aspect: AspectRatio): Box => {
    const rectangle = BLOCK_CAPTIONS.rectangle(aspect);
    const blocks = BlockCaption.blocksOf(text, BLOCK_CAPTIONS.maximumCharacters);
    const fits = blocks.every((block) => BLOCK_CAPTIONS.pill(block.text, aspect).fit.fits);
    return Box.fitted('legenda', rectangle, { fits });
  },
} as const;

/** The caption layout of each format: story → words, lesson → blocks. `check` and the renderer both pick from here. */
export const CAPTION_LAYOUTS = { story: WORD_CAPTIONS, lesson: BLOCK_CAPTIONS } as const satisfies Readonly<Record<Format, CaptionLayout>>;
