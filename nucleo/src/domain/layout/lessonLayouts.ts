import type { TitleScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Box } from './Box.ts';
import { Boxes } from './Boxes.ts';
import { Font } from './Font.ts';
import type { LayoutRegistry } from './LayoutRegistry.ts';

// Layout constants of the lesson scenes, in video pixels. All of them stay inside the safe area:
// 9:16 → x 86–994, y 250–1498; 16:9 → x 96–1824, y 54–1026. The height of each box comes from the font.
type Column = Readonly<{ x: number; width: number }>;
type Positions = Readonly<{ column: Column; overline: number; title: number; subtitle: number; caption: Column & { base: number } }>;

export const CAPTION_FONT = Font.of({ family: 'text', size: 48, lineHeight: 1.25, maximumLines: 6 });
export const OVERLINE_FONT = Font.of({ family: 'text', size: 40, lineHeight: 1.2, maximumLines: 1 });
export const TITLE_FONT = Font.of({ family: 'text', size: 96, lineHeight: 1.1, maximumLines: 2 });
export const SUBTITLE_FONT = Font.of({ family: 'text', size: 48, lineHeight: 1.25, maximumLines: 2 });

const VERTICAL_POSITIONS: Positions = {
  column: { x: 86, width: 908 }, overline: 420, title: 492, subtitle: 727,
  caption: { x: 86, width: 908, base: 1498 },
};
const HORIZONTAL_POSITIONS: Positions = {
  column: { x: 96, width: 1728 }, overline: 150, title: 214, subtitle: 449,
  caption: { x: 260, width: 1400, base: 1026 },
};

const positionsFor = (aspect: AspectRatio): Positions => (aspect.vertical() ? VERTICAL_POSITIONS : HORIZONTAL_POSITIONS);

function textBox(label: string, local: Column & { y: number }, content: { text: string; font: Font }): Box {
  return Box.withText(label, { ...local, height: content.font.maximumHeight() }, content);
}

/** The caption sits against the bottom of the safe area. */
export function captionBox(text: string, aspect: AspectRatio): Box {
  const { caption } = positionsFor(aspect);
  const y = caption.base - CAPTION_FONT.maximumHeight();
  return textBox('legenda', { x: caption.x, width: caption.width, y }, { text, font: CAPTION_FONT });
}

function titleBoxes(scene: TitleScene, aspect: AspectRatio): Boxes {
  const { column, ...y } = positionsFor(aspect);
  const overline = textBox('sobretítulo', { ...column, y: y.overline }, { text: scene.overline, font: OVERLINE_FONT });
  const boxes = Boxes.of([overline, textBox('título', { ...column, y: y.title }, { text: scene.title, font: TITLE_FONT })]);
  if (scene.subtitle === undefined) return boxes;
  return boxes.with(textBox('subtítulo', { ...column, y: y.subtitle }, { text: scene.subtitle, font: SUBTITLE_FONT }));
}

/** Only the `title` scene for now; Task 13 registers the other lesson scenes. */
export function registerLessonLayouts(registry: LayoutRegistry): LayoutRegistry {
  return registry.register('title', titleBoxes);
}
