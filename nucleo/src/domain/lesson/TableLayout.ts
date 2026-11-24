import type { Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import type { TableScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { LessonStage } from './LessonStage.ts';
import { Motion } from './Motion.ts';
import { Reveal } from './Reveal.ts';
import { CELL_PADDING, cellFont, headerFont, tableSizes, type TableSizes } from './TableFit.ts';
import { TextBlock } from './TextBlock.ts';

/** `dot` is drawn as a colored mark ("●"); `bad`/`good` start with ✕/✓. */
export type CellTone = 'dot' | 'bad' | 'good' | 'plain';
export type TableCell = Readonly<{ band: Rectangle; text: TextBlock; tone: CellTone }>;
export type TableRow = Readonly<{ rectangle: Rectangle; label: TextBlock; cells: readonly TableCell[] }>;
export type TableDrawing = Readonly<{
  panel: Rectangle; title?: TextBlock; header: readonly TableCell[]; headerBase: number; rows: readonly TableRow[]; cellSize: number; boxes: () => Boxes;
}>;

type Measures = Readonly<{ padding: number; title: Font; header: number; maximumRow: number }>;
const HORIZONTAL: Measures = { padding: 56, title: Font.of({ family: 'text', size: 50, lineHeight: 1.2, maximumLines: 1 }), header: 64, maximumRow: 84 };
const VERTICAL: Measures = { padding: 40, title: Font.of({ family: 'text', size: 44, lineHeight: 1.2, maximumLines: 2 }), header: 64, maximumRow: 84 };
const TITLE_GAP = 28;

export function toneOf(text: string): CellTone {
  if (text === '●') return 'dot';
  if (text.startsWith('✕')) return 'bad';
  if (text.startsWith('✓')) return 'good';
  return 'plain';
}

type Grid = Readonly<{ x: number; sizes: TableSizes; rowHeight: number }>;

function centered(label: string, band: Rectangle, content: Readonly<{ text: string; font: Font }>): TextBlock {
  const block = TextBlock.at(label, { x: band.x + CELL_PADDING, y: band.y, width: band.width - 2 * CELL_PADDING }, content);
  return block.movedDown((band.height - block.rectangle.height) / 2);
}

function cellsOf(texts: readonly string[], band: Rectangle, context: Readonly<{ grid: Grid; font: Font; label: (index: number) => string }>): TableCell[] {
  const { grid, font, label } = context;
  return texts.map((text, index) => {
    const column = { ...band, x: grid.x + grid.sizes.labelWidth + index * grid.sizes.columnWidth, width: grid.sizes.columnWidth };
    return { band: column, text: centered(label(index), column, { text, font }), tone: toneOf(text) };
  });
}

function rowOf(row: TableScene['rows'][number], index: number, context: Readonly<{ grid: Grid; top: number }>): TableRow {
  const { grid } = context;
  const rectangle = { x: grid.x, y: context.top + index * grid.rowHeight, width: grid.sizes.labelWidth + row.cells.length * grid.sizes.columnWidth, height: grid.rowHeight };
  const labelBand = { ...rectangle, width: grid.sizes.labelWidth };
  const label = TextBlock.at(`tabela (linha ${index + 1})`, { x: labelBand.x, y: labelBand.y, width: labelBand.width }, { text: row.label, font: cellFont(grid.sizes.label, grid.rowHeight) });
  const name = (column: number) => `tabela (linha ${index + 1}, coluna ${column + 1})`;
  const cells = cellsOf(row.cells, rectangle, { grid, font: cellFont(grid.sizes.cell, grid.rowHeight), label: name });
  return { rectangle, label: label.movedDown((grid.rowHeight - label.rectangle.height) / 2), cells };
}

// A highlighted column or row lights up in 10 frames after the change that set it.
const HIGHLIGHT_FRAMES = 10;

/** The comparison table, in a panel as tall as its rows: optional title, the column names, then each row with its label and cells. */
export class TableLayout {
  /** Laid out once in the whole content area, then again in a panel as tall as what it used, centered. */
  static for(scene: TableScene, aspect: AspectRatio): TableDrawing {
    const stage = LessonStage.for(aspect);
    const measures = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const full = TableLayout.#in(scene, stage.content(), measures);
    const last = full.rows.at(-1)?.rectangle;
    const used = (last ? last.y + last.height : full.headerBase) + measures.padding - full.panel.y;
    return TableLayout.#in(scene, stage.panelFor(used), measures);
  }

  static #in(scene: TableScene, panel: Rectangle, measures: Measures): TableDrawing {
    const inner = { x: panel.x + measures.padding, y: panel.y + measures.padding, width: panel.width - 2 * measures.padding };
    const title = scene.title === undefined ? undefined : TextBlock.at('tabela (título)', inner, { text: scene.title, font: measures.title });
    const headerTop = title ? title.bottom() + TITLE_GAP : inner.y;
    const available = panel.y + panel.height - measures.padding - headerTop - measures.header;
    const rowHeight = Math.min(measures.maximumRow, available / Math.max(1, scene.rows.length));
    const grid = { x: inner.x, sizes: tableSizes(scene, { width: inner.width, rowHeight }), rowHeight };
    const header = cellsOf(scene.columns, { ...inner, y: headerTop, height: measures.header }, { grid, font: headerFont(grid.sizes.cell), label: (index) => `tabela (coluna ${index + 1})` });
    const rows = scene.rows.map((row, index) => rowOf(row, index, { grid, top: headerTop + measures.header }));
    const blocks = [...(title ? [title] : []), ...header.map((cell) => cell.text), ...rows.flatMap((row) => [row.label, ...row.cells.map((cell) => cell.text)])];
    return { panel, title, header, headerBase: headerTop + measures.header, rows, cellSize: grid.sizes.cell, boxes: () => Boxes.of(blocks.map((block) => block.box())) };
  }

  static highlightProgress(scene: TableScene, age: number): number {
    if (scene.highlightedColumn === undefined && scene.highlightedRow === undefined) return 0;
    return Motion.ramp(age, [0, HIGHLIGHT_FRAMES]);
  }

  /** The first `shownRows` rows (all by default); the newest slides in unless a column is being highlighted. */
  static reveal(scene: TableScene): Reveal {
    return Reveal.of({ shown: scene.shownRows ?? scene.rows.length, animatesNewest: scene.highlightedColumn === undefined });
  }
}
