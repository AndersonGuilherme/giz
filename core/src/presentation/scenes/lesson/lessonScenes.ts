import { createLayoutRegistry } from '../../../domain/layout/defaultLayoutRegistry.ts';
import type { Scene } from '../../../domain/script/Scene.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import type { Language } from '../../../domain/values/Language.ts';
import type { SceneRegistry } from '../SceneRegistry.ts';
import { CardView } from './CardView.tsx';
import { ChartView } from './ChartView.tsx';
import { CodeView } from './CodeView.tsx';
import { GraphView } from './GraphView.tsx';
import { HouseView } from './HouseView.tsx';
import { InboxView } from './InboxView.tsx';
import { QuoteView } from './QuoteView.tsx';
import { SymptomsView } from './SymptomsView.tsx';
import { TableView } from './TableView.tsx';
import { TalkView } from './TalkView.tsx';
import { TerminalView } from './TerminalView.tsx';
import { TitleView } from './TitleView.tsx';
import { VersusView } from './VersusView.tsx';

// The boxes of each lesson scene are the ones the `check` sees: the same domain layouts (`lessonLayouts.ts`).
const LAYOUTS = createLayoutRegistry();
const boxes = (scene: Scene, aspect: AspectRatio, language: Language) => LAYOUTS.boxesOf(scene, aspect, language)!;

/** Registers every lesson scene with its component and its boxes. */
export function registerLessonScenes(registry: SceneRegistry): SceneRegistry {
  return registry
    .register('title', { Component: TitleView, boxes })
    .register('card', { Component: CardView, boxes })
    .register('quote', { Component: QuoteView, boxes })
    .register('chart', { Component: ChartView, boxes })
    .register('symptoms', { Component: SymptomsView, boxes })
    .register('code', { Component: CodeView, boxes })
    .register('terminal', { Component: TerminalView, boxes })
    .register('graph', { Component: GraphView, boxes })
    .register('versus', { Component: VersusView, boxes })
    .register('table', { Component: TableView, boxes })
    .register('talk', { Component: TalkView, boxes })
    .register('house', { Component: HouseView, boxes })
    .register('inbox', { Component: InboxView, boxes });
}
