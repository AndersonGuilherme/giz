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
import { Boxes } from './Boxes.ts';
import { GraphLayout } from './GraphLayout.ts';
import type { LayoutRegistry } from './LayoutRegistry.ts';

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
