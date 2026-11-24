import { MonospaceBlock } from '../code/MonospaceBlock.ts';
import { Box, type Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import type { TerminalScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { LessonStage } from './LessonStage.ts';

export type TerminalRow = Readonly<{ text: string; tone: NonNullable<TerminalScene['lines'][number]['tone']>; rectangle: Rectangle }>;
export type TerminalDrawing = Readonly<{ panel: Rectangle; prompt: Rectangle; size: number; rows: readonly TerminalRow[]; boxes: () => Boxes }>;

type Measures = Readonly<{ padding: number; size: number }>;
const HORIZONTAL: Measures = { padding: 56, size: 32 };
const VERTICAL: Measures = { padding: 40, size: 28 };
const LINE_HEIGHT = 1.7;
const PROMPT = '$ ';

/** The terminal: the typed command after the prompt, then its output lines; nothing wraps, the letters shrink. */
export class TerminalLayout {
  static for(scene: TerminalScene, aspect: AspectRatio): TerminalDrawing {
    const panel = LessonStage.for(aspect).content();
    const { padding, size } = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const inner = { x: panel.x + padding, y: panel.y + padding, width: panel.width - 2 * padding, height: panel.height - 2 * padding };
    // One more character after the command: the cursor.
    const texts = [`${PROMPT}${scene.command} `, ...scene.lines.map((line) => line.text)];
    const fitted = MonospaceBlock.fit(texts, inner, { size, lineHeight: LINE_HEIGHT });
    const rowAt = (index: number): Rectangle => ({ ...inner, y: inner.y + index * fitted.rowHeight, height: fitted.rowHeight });
    const rows = scene.lines.map((line, index) => ({ text: line.text, tone: line.tone ?? 'dim', rectangle: rowAt(index + 1) }));
    const block = { ...inner, height: Math.min(texts.length * fitted.rowHeight, inner.height) };
    const boxes = () => Boxes.of([Box.withText('terminal', block, { text: fitted.measured, font: fitted.font })]);
    return { panel, prompt: rowAt(0), size: fitted.fit.size, rows, boxes };
  }
}
