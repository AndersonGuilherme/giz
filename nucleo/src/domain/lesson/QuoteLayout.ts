import { Box, type Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { TextFit } from '../layout/TextFit.ts';
import type { QuoteScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { LessonStage } from './LessonStage.ts';
import { TextBlock } from './TextBlock.ts';

/** A drawn line of the quote; `paragraph` staggers the entrance and the last paragraph is drawn in the brand color. */
export type QuoteLine = Readonly<{ text: string; paragraph: number; last: boolean }>;
export type QuoteDrawing = Readonly<{ mark: Rectangle; markSize: number; text: TextBlock; lines: readonly QuoteLine[]; boxes: () => Boxes }>;

type Measures = Readonly<{ mark: number; font: Font }>;
const HORIZONTAL: Measures = { mark: 220, font: Font.of({ family: 'text', size: 76, lineHeight: 1.15, maximumLines: 5 }) };
const VERTICAL: Measures = { mark: 200, font: Font.of({ family: 'text', size: 68, lineHeight: 1.15, maximumLines: 7 }) };
// The quote mark glyph sits in the top third of its size; the text follows 18 px below it.
const MARK_HEIGHT = 0.34;
const GAP = 18;

// The lines of each paragraph at the size `TextFit` chose for the whole text (same wrap, paragraph by paragraph).
function linesOf(text: string, block: TextBlock): QuoteLine[] {
  const paragraphs = text.trim().split('\n');
  const font = Font.of({ family: 'text', size: block.fit.size, lineHeight: 1, maximumLines: block.fit.lines.length });
  const counts = paragraphs.map((paragraph) => TextFit.measure(paragraph, font, block.rectangle.width).lines.length);
  const owners = counts.flatMap((count, paragraph) => Array.from({ length: count }, () => paragraph));
  return block.fit.lines.map((line, index) => ({ text: line, paragraph: owners[index] ?? 0, last: owners[index] === paragraphs.length - 1 }));
}

/** The key sentence: a big quote mark and the lines, centered on the height of the content area. */
export class QuoteLayout {
  static for(scene: QuoteScene, aspect: AspectRatio): QuoteDrawing {
    const content = LessonStage.for(aspect).content();
    const { mark: markSize, font } = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const markHeight = markSize * MARK_HEIGHT;
    const measured = TextBlock.at('citação', { x: content.x, y: 0, width: content.width }, { text: scene.text, font });
    const total = markHeight + GAP + measured.rectangle.height;
    const top = content.y + Math.max(0, (content.height - total) / 2);
    const mark = { x: content.x, y: top, width: markSize * 0.5, height: markHeight };
    const text = measured.movedDown(top + markHeight + GAP);
    return { mark, markSize, text, lines: linesOf(scene.text, text), boxes: () => Boxes.of([Box.of('aspas', mark), text.box()]) };
  }
}
