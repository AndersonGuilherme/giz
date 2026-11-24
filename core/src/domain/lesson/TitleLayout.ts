import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import type { TitleScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { LessonStage } from './LessonStage.ts';
import { TextBlock } from './TextBlock.ts';

type Fonts = Readonly<{ overline: Font; title: Font; subtitle: Font }>;
export type TitleDrawing = Readonly<{ overline: TextBlock; title: TextBlock; subtitle?: TextBlock; boxes: () => Boxes }>;

// 16:9 follows the motor (title in the content column, a little smaller than its 124 px); 9:16 keeps two lines so a long title shrinks instead of
// taking the whole screen.
const HORIZONTAL: Fonts = {
  overline: Font.of({ family: 'text', size: 36, lineHeight: 1.2, maximumLines: 1 }),
  title: Font.of({ family: 'text', size: 112, lineHeight: 1.05, maximumLines: 3 }),
  subtitle: Font.of({ family: 'text', size: 46, lineHeight: 1.25, maximumLines: 2 }),
};
const VERTICAL: Fonts = {
  overline: Font.of({ family: 'text', size: 40, lineHeight: 1.2, maximumLines: 1 }),
  title: Font.of({ family: 'text', size: 96, lineHeight: 1.1, maximumLines: 2 }),
  subtitle: Font.of({ family: 'text', size: 48, lineHeight: 1.25, maximumLines: 2 }),
};
const GAP = 28;

function stacked(scene: TitleScene, fonts: Fonts, place: { x: number; width: number }): TextBlock[] {
  const overline = TextBlock.at('sobretítulo', { ...place, y: 0 }, { text: scene.overline, font: fonts.overline });
  const title = TextBlock.at('título', { ...place, y: overline.bottom() + GAP }, { text: scene.title, font: fonts.title });
  if (scene.subtitle === undefined) return [overline, title];
  return [overline, title, TextBlock.at('subtítulo', { ...place, y: title.bottom() + GAP }, { text: scene.subtitle, font: fonts.subtitle })];
}

/** The title scene: overline, title and optional subtitle, centered on the height of the content area. */
export class TitleLayout {
  static for(scene: TitleScene, aspect: AspectRatio): TitleDrawing {
    const content = LessonStage.for(aspect).content();
    const blocks = stacked(scene, aspect.vertical() ? VERTICAL : HORIZONTAL, content);
    const offset = content.y + Math.max(0, (content.height - blocks.at(-1)!.bottom()) / 2);
    const [overline, title, subtitle] = blocks.map((block) => block.movedDown(offset));
    return { overline: overline!, title: title!, subtitle, boxes: () => Boxes.of(blocks.map((block) => block.movedDown(offset).box())) };
  }
}
