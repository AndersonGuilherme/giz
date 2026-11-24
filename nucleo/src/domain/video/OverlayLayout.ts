import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { SafeArea } from '../layout/SafeArea.ts';
import { TextBlock } from '../lesson/TextBlock.ts';
import type { Format } from '../project/Project.ts';
import type { Scene } from '../script/Scene.ts';
import type { VideoProps } from '../timeline/VideoProps.ts';
import { AspectRatio } from '../values/AspectRatio.ts';
import type { SceneOnScreen } from './SceneRuns.ts';

/**
 * What the frame may show: the project brand (only when declared) and the current chapter name; `sceneType` is the scene
 * on screen (the `check`, without it, measures the frame as it is beside the content).
 */
export type OverlayContent = Readonly<{ brand?: string; chapter?: string; sceneType?: Scene['type'] }>;

// The motor's lesson header (`motor/src/Lesson.tsx`): brand at 58 px, chapter at 32 px below it, in the left column
// (x from the safe area to 40 px before the content column at x 600, as the motor's 470 px).
const BRAND_FONT = Font.of({ family: 'text', size: 58, lineHeight: 1.1, maximumLines: 1 });
const CHAPTER_FONT = Font.of({ family: 'text', size: 32, lineHeight: 1.2, maximumLines: 2 });
const COLUMN_END = 560;
const GAP = 12;

const NOTHING = { brand: undefined, chapter: undefined, boxes: () => Boxes.empty() } as const;

/** The blocks of the frame drawn over the scene, and their boxes for the `check`. */
export type OverlayDrawing = Readonly<{ brand?: TextBlock; chapter?: TextBlock; boxes: () => Boxes }>;

type Blocks = Readonly<{ brand?: TextBlock; chapter?: TextBlock }>;

function stacked(content: OverlayContent, place: { x: number; y: number; width: number }): Blocks {
  const brand = content.brand === undefined ? undefined : TextBlock.at('marca', place, { text: content.brand, font: BRAND_FONT });
  // On the talk stage the presenters take the screen: the chapter hides, as in the motor.
  if (content.chapter === undefined || content.sceneType === 'talk') return { brand };
  const below = { ...place, y: brand ? brand.bottom() + GAP : place.y };
  return { brand, chapter: TextBlock.at('capítulo', below, { text: content.chapter, font: CHAPTER_FONT }) };
}

/**
 * The brand and chapter frame. Only the 16:9 lesson has room for it (the left column, above the presenters). In 9:16 the
 * lesson content starts at the top of the safe area and above it the Reels/Shorts interface covers the screen, and a
 * story keeps the scene clean, like the reference videos: both have no frame.
 */
export class OverlayLayout {
  static for(aspect: AspectRatio, format: Format, content: OverlayContent): OverlayDrawing {
    if (aspect.vertical() || format !== 'lesson') return NOTHING;
    const safeArea = SafeArea.for(aspect);
    const blocks = stacked(content, { x: safeArea.x, y: safeArea.y, width: COLUMN_END - safeArea.x });
    const shown = [blocks.brand, blocks.chapter].filter((block) => block !== undefined);
    return { ...blocks, boxes: () => Boxes.of(shown.map((block) => block.box())) };
  }

  /** The frame of a video frame: the brand of the video, the chapter of the segment on screen and its scene type. */
  static forVideo(props: VideoProps, onScreen: SceneOnScreen): OverlayDrawing {
    const aspect = AspectRatio.ofSize(props.width, props.height);
    const content = { brand: props.brand, chapter: props.chapters[onScreen.chapter - 1], sceneType: onScreen.scene.type };
    return OverlayLayout.for(aspect, props.format, content);
  }
}
