import type { Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font, type FontMeasures } from '../layout/Font.ts';
import type { VersusScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { LessonStage } from './LessonStage.ts';
import { TextBlock } from './TextBlock.ts';

type SideName = 'wrong' | 'right';
export type VersusSide = Readonly<{ side: SideName; panel: Rectangle; icon: Rectangle; title: TextBlock; text: TextBlock; delay: number }>;
export type VersusDrawing = Readonly<{ sides: readonly VersusSide[]; boxes: () => Boxes }>;

// 16:9: side by side, icon above the title (the motor). 9:16: one above the other, icon beside the title.
type Measures = Readonly<{ stacked: boolean; gap: number; padding: number; icon: number; spacing: number; title: Font; text: Omit<FontMeasures, 'maximumLines'> }>;
const HORIZONTAL: Measures = {
  stacked: false, gap: 40, padding: 50, icon: 96, spacing: 28,
  title: Font.of({ family: 'text', size: 54, lineHeight: 1.15, maximumLines: 3 }), text: { size: 38, lineHeight: 1.35 },
};
const VERTICAL: Measures = {
  stacked: true, gap: 28, padding: 36, icon: 72, spacing: 20,
  title: Font.of({ family: 'text', size: 46, lineHeight: 1.15, maximumLines: 2 }), text: { size: 34, lineHeight: 1.3 },
};
// The right side pops in 20 frames after the wrong one.
const DELAYS: Readonly<Record<SideName, number>> = { wrong: 0, right: 20 };

function panelOf(index: number, content: Rectangle, measures: Measures): Rectangle {
  if (measures.stacked) {
    const height = (content.height - measures.gap) / 2;
    return { ...content, y: content.y + index * (height + measures.gap), height };
  }
  const width = (content.width - measures.gap) / 2;
  return { ...content, x: content.x + index * (width + measures.gap), width };
}

// The text takes as many lines as the rest of its panel holds.
function textBelow(top: number, panel: Rectangle, context: Readonly<{ text: string; label: string; measures: Measures }>): TextBlock {
  const { measures } = context;
  const room = panel.y + panel.height - measures.padding - top;
  const lines = Math.max(1, Math.floor(room / (measures.text.size * measures.text.lineHeight)));
  const font = Font.of({ family: 'text', ...measures.text, maximumLines: lines });
  return TextBlock.at(`${context.label} (texto)`, { x: panel.x + measures.padding, y: top, width: panel.width - 2 * measures.padding }, { text: context.text, font });
}

function sideOf(side: SideName, scene: VersusScene, context: Readonly<{ panel: Rectangle; measures: Measures }>): VersusSide {
  const { panel, measures } = context;
  const label = side === 'wrong' ? 'errado' : 'certo';
  const icon = { x: panel.x + measures.padding, y: panel.y + measures.padding, width: measures.icon, height: measures.icon };
  const shift = measures.stacked ? measures.icon + measures.spacing : 0;
  const titleTop = measures.stacked ? icon.y : icon.y + measures.icon + measures.spacing;
  const place = { x: icon.x + shift, y: titleTop, width: panel.width - 2 * measures.padding - shift };
  const title = TextBlock.at(`${label} (título)`, place, { text: scene[side].title, font: measures.title });
  const top = Math.max(title.bottom(), measures.stacked ? icon.y + icon.height : 0) + measures.spacing / 2;
  return { side, panel, icon, title, text: textBelow(top, panel, { text: scene[side].text, label, measures }), delay: DELAYS[side] };
}

/** Wrong × right: two panels with their mark, a title and a short text. */
export class VersusLayout {
  static for(scene: VersusScene, aspect: AspectRatio): VersusDrawing {
    const content = LessonStage.for(aspect).content();
    const measures = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const sides = (['wrong', 'right'] as const).map((side, index) => sideOf(side, scene, { panel: panelOf(index, content, measures), measures }));
    return { sides, boxes: () => Boxes.of(sides.flatMap((side) => [side.title.box(), side.text.box()])) };
  }
}
