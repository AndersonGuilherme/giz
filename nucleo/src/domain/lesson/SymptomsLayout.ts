import type { Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font, type FontMeasures } from '../layout/Font.ts';
import { fixedTexts } from '../i18n/fixedTexts.ts';
import type { SymptomsScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Language } from '../values/Language.ts';
import { Motion } from './Motion.ts';
import { LessonStage } from './LessonStage.ts';
import { TextBlock } from './TextBlock.ts';

export type SymptomCell = Readonly<{ rectangle: Rectangle; clue: TextBlock; name: TextBlock; description: TextBlock }>;
export type SymptomsDrawing = Readonly<{ cells: readonly SymptomCell[]; boxes: () => Boxes }>;

type Measures = Readonly<{ gap: number; padding: number; spacing: number; clue: Font; name: Font; description: FontMeasures }>;
const COLUMNS = 2;
const HORIZONTAL: Measures = {
  gap: 32, padding: 44, spacing: 18,
  clue: Font.of({ family: 'text', size: 30, lineHeight: 1.2, maximumLines: 1 }),
  name: Font.of({ family: 'text', size: 64, lineHeight: 1.1, maximumLines: 1 }),
  description: { size: 34, lineHeight: 1.25, maximumLines: 1 },
};
const VERTICAL: Measures = {
  gap: 24, padding: 32, spacing: 14,
  clue: Font.of({ family: 'text', size: 28, lineHeight: 1.2, maximumLines: 1 }),
  name: Font.of({ family: 'text', size: 48, lineHeight: 1.1, maximumLines: 2 }),
  description: { size: 30, lineHeight: 1.3, maximumLines: 1 },
};
// The description takes as many lines as the rest of the card holds (`maximumLines` above is a placeholder).
function descriptionFont(measures: FontMeasures, height: number): Font {
  const lines = Math.max(1, Math.floor(height / (measures.size * measures.lineHeight)));
  return Font.of({ family: 'text', ...measures, maximumLines: lines });
}
// Out of focus, a clue fades to 40% in 8 frames; the focused one grows 3%.
const DIMMED = 0.4;
const FOCUS_FRAMES = 8;

type Item = SymptomsScene['items'][number];
type Grid = Readonly<{ content: Rectangle; rows: number; measures: Measures }>;

function cellRectangle(index: number, grid: Grid): Rectangle {
  const { content, rows, measures } = grid;
  const width = (content.width - (COLUMNS - 1) * measures.gap) / COLUMNS;
  const height = (content.height - (rows - 1) * measures.gap) / rows;
  const [column, row] = [index % COLUMNS, Math.floor(index / COLUMNS)];
  return { x: content.x + column * (width + measures.gap), y: content.y + row * (height + measures.gap), width, height };
}

function cellOf(item: Item, index: number, context: Readonly<{ grid: Grid; clue: string }>): SymptomCell {
  const rectangle = cellRectangle(index, context.grid);
  const { padding, spacing, ...fonts } = context.grid.measures;
  const place = { x: rectangle.x + padding, width: rectangle.width - 2 * padding };
  const label = `sintoma ${index + 1}`;
  const clue = TextBlock.at(`${label} (pista)`, { ...place, y: rectangle.y + padding }, { text: `${context.clue} ${String(index + 1).padStart(2, '0')}`, font: fonts.clue });
  const name = TextBlock.at(`${label} (nome)`, { ...place, y: clue.bottom() + spacing }, { text: item.name, font: fonts.name });
  const top = name.bottom() + spacing;
  const font = descriptionFont(fonts.description, rectangle.y + rectangle.height - padding - top);
  const description = TextBlock.at(`${label} (descrição)`, { ...place, y: top }, { text: item.description, font });
  return { rectangle, clue, name, description };
}

/** The clues grid (2 columns): each card has its number, the name of the symptom and a short description. */
export class SymptomsLayout {
  static for(scene: SymptomsScene, aspect: AspectRatio, language: Language): SymptomsDrawing {
    const grid = { content: LessonStage.for(aspect).content(), rows: Math.ceil(scene.items.length / COLUMNS), measures: aspect.vertical() ? VERTICAL : HORIZONTAL };
    const clue = fixedTexts(language).clue.toUpperCase();
    const cells = scene.items.map((item, index) => cellOf(item, index, { grid, clue }));
    return { cells, boxes: () => Boxes.of(cells.flatMap((cell) => [cell.clue, cell.name, cell.description].map((block) => block.box()))) };
  }

  /** Opacity of a clue `age` frames after the focus changed: the focused one comes back to 1, the others fade. */
  static focusOpacity(scene: SymptomsScene, index: number, age: number): number {
    if (scene.focus === undefined) return 1;
    const progress = Motion.ramp(age, [0, FOCUS_FRAMES]);
    const [from, to] = scene.focus === index ? [DIMMED, 1] : [1, DIMMED];
    return from + (to - from) * progress;
  }
}
