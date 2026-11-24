import { CodeLanguage, Tokens, type Token } from '../code/Tokens.ts';
import { MonospaceBlock, type MonospaceFit } from '../code/MonospaceBlock.ts';
import { Box, type Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import type { CodeScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { LessonStage } from './LessonStage.ts';
import { Motion } from './Motion.ts';
import { TextBlock } from './TextBlock.ts';

export type CodeRow = Readonly<{ number: number; rectangle: Rectangle; tokens: readonly Token[]; added: boolean; highlighted: boolean }>;
export type CodeGutter = Readonly<{ plus: number; number: number; numberPadding: number }>;
export type CodeDrawing = Readonly<{
  panel: Rectangle; bar: Rectangle; title: TextBlock; body: Rectangle; gutter: CodeGutter; textWidth: number;
  size: number; rows: readonly CodeRow[]; hasHighlight: boolean; boxes: () => Boxes;
}>;

type Measures = Readonly<{ bar: number; padding: number; gutter: CodeGutter; size: number; title: Font }>;
// The motor: 76 px window bar, "+" column 54 px, line numbers 56 px + 24 of padding, code at 34 px with rows of ~52.
const HORIZONTAL: Measures = { bar: 76, padding: 30, gutter: { plus: 54, number: 56, numberPadding: 24 }, size: 34, title: Font.of({ family: 'mono', size: 26, lineHeight: 1.2, maximumLines: 1 }) };
const VERTICAL: Measures = { bar: 64, padding: 24, gutter: { plus: 40, number: 44, numberPadding: 16 }, size: 30, title: Font.of({ family: 'mono', size: 24, lineHeight: 1.2, maximumLines: 1 }) };
const LINE_HEIGHT = 1.5;
// Where the title chip starts in the bar: after the three window dots.
const TITLE_START = 150;
const HIGHLIGHT_FRAMES = 8;

const gutterWidth = (gutter: CodeGutter): number => gutter.plus + gutter.number + gutter.numberPadding;

function rowsOf(scene: CodeScene, fitted: MonospaceFit, body: Rectangle): CodeRow[] {
  const language = CodeLanguage.fromFileName(scene.title);
  const highlights = scene.highlight ?? [];
  return scene.lines.map((line, index) => ({
    number: index + 1,
    rectangle: { x: body.x, y: body.y + index * fitted.rowHeight, width: body.width, height: fitted.rowHeight },
    tokens: Tokens.of(line, language),
    added: (scene.added ?? []).includes(index),
    highlighted: highlights.some((highlight) => line.includes(highlight)),
  }));
}

function titleIn(scene: CodeScene, bar: Rectangle, measures: Measures): TextBlock {
  const height = measures.title.baseSize() * measures.title.lineHeight();
  const place = { x: bar.x + TITLE_START, y: bar.y + (bar.height - height) / 2, width: bar.width - TITLE_START - measures.padding };
  return TextBlock.at('código (título)', place, { text: scene.title, font: measures.title });
}

/** The code window, as tall as its lines: bar with the file name, then each line with its "+" mark, its number and its colored tokens. */
export class CodeLayout {
  static for(scene: CodeScene, aspect: AspectRatio): CodeDrawing {
    const stage = LessonStage.for(aspect);
    const measures = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const chrome = measures.bar + 2 * measures.padding;
    const textWidth = stage.content().width - measures.padding - gutterWidth(measures.gutter);
    const fitted = MonospaceBlock.fit(scene.lines, { width: textWidth, height: stage.content().height - chrome }, { size: measures.size, lineHeight: LINE_HEIGHT });
    const panel = stage.panelFor(chrome + scene.lines.length * fitted.rowHeight);
    const bar = { ...panel, height: measures.bar };
    const body = { x: panel.x, y: panel.y + measures.bar + measures.padding, width: panel.width - measures.padding, height: panel.height - chrome };
    const rows = rowsOf(scene, fitted, body);
    const title = titleIn(scene, bar, measures);
    const code = { x: body.x + gutterWidth(measures.gutter), y: body.y, width: textWidth, height: Math.min(rows.length * fitted.rowHeight, body.height) };
    const boxes = () => Boxes.of([title.box(), Box.withText('código', code, { text: fitted.measured, font: fitted.font })]);
    return { panel, bar, title, body, gutter: measures.gutter, textWidth, size: fitted.fit.size, rows, hasHighlight: (scene.highlight ?? []).length > 0, boxes };
  }

  /** 0 → 1 in the 8 frames after the change that set the highlight; the other lines dim as it grows. */
  static highlightProgress(age: number): number {
    return Motion.ramp(age, [0, HIGHLIGHT_FRAMES]);
  }
}
