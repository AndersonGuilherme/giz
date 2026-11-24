import { CardLayout } from '../lesson/CardLayout.ts';
import { ChartLayout } from '../lesson/ChartLayout.ts';
import { CodeLayout } from '../lesson/CodeLayout.ts';
import { LessonStage } from '../lesson/LessonStage.ts';
import { QuoteLayout } from '../lesson/QuoteLayout.ts';
import { SymptomsLayout } from '../lesson/SymptomsLayout.ts';
import { TableLayout } from '../lesson/TableLayout.ts';
import { TerminalLayout } from '../lesson/TerminalLayout.ts';
import { TitleLayout } from '../lesson/TitleLayout.ts';
import { VersusLayout } from '../lesson/VersusLayout.ts';
import type { GraphScene } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Box } from './Box.ts';
import { Boxes } from './Boxes.ts';
import { Font } from './Font.ts';
import { GraphLayout } from './GraphLayout.ts';
import type { LayoutRegistry } from './LayoutRegistry.ts';

// The caption box, in video pixels, inside the safe area (9:16 → x 86–994, y 250–1498; 16:9 → x 96–1824, y 54–1026).
// In 16:9 it sits under the lesson content column, as in the motor, with smaller letters (4 lines of 40 px).
type CaptionPlace = Readonly<{ x: number; width: number; base: number; font: Font }>;

export const CAPTION_FONT = Font.of({ family: 'text', size: 48, lineHeight: 1.25, maximumLines: 6 });
export const WIDE_CAPTION_FONT = Font.of({ family: 'text', size: 40, lineHeight: 1.25, maximumLines: 4 });

const VERTICAL_CAPTION: CaptionPlace = { x: 86, width: 908, base: 1498, font: CAPTION_FONT };
const HORIZONTAL_CAPTION: CaptionPlace = { x: 600, width: 1224, base: 1026, font: WIDE_CAPTION_FONT };

/** The caption sits against the bottom of the safe area; its box is as tall as its most lines. */
export function captionBox(text: string, aspect: AspectRatio): Box {
  const { base, font, ...column } = aspect.vertical() ? VERTICAL_CAPTION : HORIZONTAL_CAPTION;
  const height = font.maximumHeight();
  return Box.withText('legenda', { ...column, y: base - height, height }, { text, font });
}

function graphBoxes(scene: GraphScene, aspect: AspectRatio): Boxes {
  const layout = GraphLayout.place(scene.nodes, LessonStage.for(aspect).content());
  layout.edges(scene.edges);
  return layout.boxes();
}

/** Every lesson scene: the boxes its texts take in each aspect ratio (the same layout the video draws). */
export function registerLessonLayouts(registry: LayoutRegistry): LayoutRegistry {
  return registry
    .register('title', (scene, aspect) => TitleLayout.for(scene, aspect).boxes())
    .register('card', (scene, aspect, language) => CardLayout.for(scene, aspect, language).boxes())
    .register('quote', (scene, aspect) => QuoteLayout.for(scene, aspect).boxes())
    .register('chart', (scene, aspect, language) => ChartLayout.for(scene, aspect, language).boxes())
    .register('symptoms', (scene, aspect, language) => SymptomsLayout.for(scene, aspect, language).boxes())
    .register('code', (scene, aspect) => CodeLayout.for(scene, aspect).boxes())
    .register('terminal', (scene, aspect) => TerminalLayout.for(scene, aspect).boxes())
    .register('graph', graphBoxes)
    .register('versus', (scene, aspect) => VersusLayout.for(scene, aspect).boxes())
    .register('table', (scene, aspect) => TableLayout.for(scene, aspect).boxes())
    .register('talk', () => Boxes.empty());
}
