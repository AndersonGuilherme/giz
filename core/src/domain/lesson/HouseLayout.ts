import type { Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { fixedTexts } from '../i18n/fixedTexts.ts';
import type { HouseScene, HOUSE_MARKS } from '../script/LessonScenes.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Language } from '../values/Language.ts';
import type { Fps } from '../values/Time.ts';
import { LessonStage } from './LessonStage.ts';
import { Motion } from './Motion.ts';
import { TextBlock } from './TextBlock.ts';

export type HouseMark = (typeof HOUSE_MARKS)[number];
/** `art` is where the drawing (a 1000 × 680 canvas) goes, `scale` its pixels per canvas unit; the labels are in video pixels. */
export type HouseDrawing = Readonly<{
  panel: Rectangle; art: Rectangle; scale: number; wall: TextBlock; tv: TextBlock; boxes: () => Boxes;
}>;

// The motor's analogy: a 1000 × 680 drawing inside the panel (56 px of padding), scaled to fit like an SVG viewBox.
const CANVAS = { width: 1000, height: 680 } as const;
const PADDING = 56;
// Each label is centered over its breakage (x 220 and 790 of the canvas), two 38-unit lines from y 36.
const LABEL = { width: 400, top: 36, size: 38, lineHeight: 46 / 38 } as const;
const WALL_CENTER = 220;
const TV_CENTER = 790;
// The TV blinks every 4 frames once the shower broke it.
const BLINK_FRAMES = 4;

function artIn(panel: Rectangle): Readonly<{ art: Rectangle; scale: number }> {
  const room = { width: panel.width - 2 * PADDING, height: panel.height - 2 * PADDING };
  const scale = Math.min(room.width / CANVAS.width, room.height / CANVAS.height);
  const width = CANVAS.width * scale;
  const height = CANVAS.height * scale;
  const art = { x: panel.x + PADDING + (room.width - width) / 2, y: panel.y + PADDING + (room.height - height) / 2, width, height };
  return { art, scale };
}

type Placement = Readonly<{ art: Rectangle; scale: number }>;

function labelAt(text: string, center: number, placement: Placement): TextBlock {
  const { art, scale } = placement;
  const font = Font.of({ family: 'text', size: LABEL.size * scale, lineHeight: LABEL.lineHeight, maximumLines: 2 });
  const place = { x: art.x + (center - LABEL.width / 2) * scale, y: art.y + LABEL.top * scale, width: LABEL.width * scale };
  return TextBlock.at(`casa (${text.split('\n')[0]})`, place, { text, font });
}

const has = (scene: HouseScene, mark: HouseMark): boolean => scene.marks.includes(mark);

/** The house analogy: a house whose far-off parts break, one mark at a time, each with its label. */
export class HouseLayout {
  static for(scene: HouseScene, aspect: AspectRatio, language: Language): HouseDrawing {
    const panel = LessonStage.for(aspect).content();
    const placement = artIn(panel);
    const texts = fixedTexts(language);
    const wall = labelAt(texts.houseWall, WALL_CENTER, placement);
    const tv = labelAt(texts.houseTv, TV_CENTER, placement);
    const shown = [has(scene, 'wall') ? [wall] : [], has(scene, 'tv') ? [tv] : []].flat();
    return { panel, ...placement, wall, tv, boxes: () => Boxes.of(shown.map((label) => label.box())) };
  }

  static has(scene: HouseScene, mark: HouseMark): boolean {
    return has(scene, mark);
  }

  /** 0 without the mark; the newest mark pops in from the last change (`age`), the older ones are settled. */
  static markProgress(scene: HouseScene, mark: HouseMark, clock: Readonly<{ age: number; fps: Fps }>): number {
    if (!has(scene, mark)) return 0;
    if (scene.marks.at(-1) !== mark) return 1;
    return Motion.pop(clock.age, clock.fps);
  }

  /** Whether the broken TV is dark in this frame (it blinks). */
  static screenOff(scene: HouseScene, age: number): boolean {
    return has(scene, 'tv') && Math.floor(age / BLINK_FRAMES) % 2 === 0;
  }
}
