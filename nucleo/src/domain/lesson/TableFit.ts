import { Font } from '../layout/Font.ts';
import { TextFit } from '../layout/TextFit.ts';
import type { TableScene } from '../script/LessonScenes.ts';

/** The letter size of every cell and the width of the label column and of each cell column. */
export type TableSizes = Readonly<{ cell: number; label: number; labelWidth: number; columnWidth: number }>;
type Room = Readonly<{ width: number; rowHeight: number }>;

// Port of the motor's table loop: start from 42% of the row height (20–32 px) and lower the letters one pixel at a
// time until every label and cell fits its row without shrinking; at 16 px it stops and `TextFit` does the rest.
const LARGEST = 32;
const SMALLEST = 16;
const LINE_HEIGHT = 1.2;
const ROW_PADDING = 6;
export const CELL_PADDING = 8;
const LABEL_SHARE = 0.42;
const LABEL_MINIMUM = 220;
const LABEL_CHARACTER_IN_EM = 0.56;

export function cellFont(size: number, rowHeight: number): Font {
  const lines = Math.max(1, Math.floor((rowHeight - ROW_PADDING) / (size * LINE_HEIGHT)));
  return Font.of({ family: 'text', size, lineHeight: LINE_HEIGHT, maximumLines: lines });
}

// The column names: 4 px smaller than the cells, on one line.
export function headerFont(cellSize: number): Font {
  return Font.of({ family: 'text', size: cellSize - 4, lineHeight: 1.15, maximumLines: 1 });
}

function sizesAt(cell: number, scene: TableScene, room: Room): TableSizes {
  const longest = Math.max(1, ...scene.rows.map((row) => row.label.length));
  const label = cell + 2;
  const labelWidth = Math.min(room.width * LABEL_SHARE, Math.max(LABEL_MINIMUM, longest * label * LABEL_CHARACTER_IN_EM + 24));
  return { cell, label, labelWidth, columnWidth: (room.width - labelWidth) / Math.max(1, scene.columns.length) };
}

const fitsWhole = (text: string, font: Font, width: number): boolean => TextFit.measure(text, font, width).size === font.baseSize();

function everythingFits(sizes: TableSizes, scene: TableScene, room: Room): boolean {
  const labelFont = cellFont(sizes.label, room.rowHeight);
  const font = cellFont(sizes.cell, room.rowHeight);
  const cellWidth = sizes.columnWidth - 2 * CELL_PADDING;
  const header = scene.columns.every((name) => fitsWhole(name, headerFont(sizes.cell), cellWidth));
  return header && scene.rows.every((row) => fitsWhole(row.label, labelFont, sizes.labelWidth) && row.cells.every((cell) => fitsWhole(cell, font, cellWidth)));
}

export function tableSizes(scene: TableScene, room: Room): TableSizes {
  const start = Math.round(Math.max(20, Math.min(LARGEST, room.rowHeight * 0.42)));
  const candidates = Array.from({ length: start - SMALLEST + 1 }, (_empty, step) => sizesAt(start - step, scene, room));
  return candidates.find((sizes) => everythingFits(sizes, scene, room)) ?? candidates.at(-1)!;
}
