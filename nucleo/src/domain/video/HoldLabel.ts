import { BLOCK_CAPTIONS } from '../caption/captionLayouts.ts';
import { Box, type Rectangle } from '../layout/Box.ts';
import { Font } from '../layout/Font.ts';
import { TextBlock } from '../lesson/TextBlock.ts';
import type { Format } from '../project/Project.ts';
import type { HoldAfter } from '../script/Line.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import { Fps } from '../values/Time.ts';

/** The pill drawn during the hold after a line: the countdown badge, then the label; `box()` is what the `check` sees. */
export type HoldDrawing = Readonly<{ pill: Rectangle; badge: Rectangle; digitSize: number; label: TextBlock; box: () => Box }>;

/** What the countdown needs of a segment: when the line ends (relative frames) and its hold, if any. */
export type HeldSegment = Readonly<{ lineDuration: number; holdAfter?: HoldAfter }>;

type Measures = Readonly<{ width: number; badge: number; digitSize: number; padding: Readonly<{ x: number; y: number }>; gap: number; font: Font }>;

// The motor's hold card (`motor/src/Lesson.tsx`): a round badge with the seconds left and the label beside it.
const HORIZONTAL: Measures = {
  width: 620, badge: 84, digitSize: 48, padding: { x: 26, y: 22 }, gap: 20, font: Font.of({ family: 'text', size: 30, lineHeight: 1.2, maximumLines: 2 }),
};
const VERTICAL: Measures = {
  width: 760, badge: 104, digitSize: 60, padding: { x: 30, y: 24 }, gap: 24, font: Font.of({ family: 'text', size: 40, lineHeight: 1.2, maximumLines: 2 }),
};

// The pill sits at the base of the caption place, centered: during the hold the caption gives way to it (as in the motor).
function pillIn(place: Rectangle, measures: Measures, height: number): Rectangle {
  const width = Math.min(measures.width, place.width);
  return { x: place.x + (place.width - width) / 2, y: place.y + place.height - height, width, height };
}

/** The hold after a line: where its label and countdown go, and how many seconds are left at each frame. */
export class HoldLabel {
  static for(text: string, aspect: AspectRatio, format: Format): HoldDrawing {
    const measures = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const { badge, padding, gap } = measures;
    const textWidth = Math.min(measures.width, BLOCK_CAPTIONS.rectangle(aspect, format).width) - 2 * padding.x - badge - gap;
    const measured = TextBlock.at('rótulo da pausa', { x: 0, y: 0, width: textWidth }, { text, font: measures.font });
    const height = Math.max(badge, measured.rectangle.height) + 2 * padding.y;
    const pill = pillIn(BLOCK_CAPTIONS.rectangle(aspect, format), measures, height);
    const middle = pill.y + pill.height / 2;
    const label = TextBlock.at('rótulo da pausa', { x: pill.x + padding.x + badge + gap, y: middle - measured.rectangle.height / 2, width: textWidth }, { text, font: measures.font });
    const badgeRectangle = { x: pill.x + padding.x, y: middle - badge / 2, width: badge, height: badge };
    return { pill, badge: badgeRectangle, digitSize: measures.digitSize, label, box: () => Box.fitted('rótulo da pausa', pill, { fits: label.fit.fits }) };
  }

  /** Whole seconds left in the hold at the relative `frame`; `undefined` outside it (while speaking, after it, no hold). */
  static secondsLeft(segment: HeldSegment, frame: number): number | undefined {
    const fps = Fps.DEFAULT.value();
    const holdFrames = Math.round((segment.holdAfter?.seconds ?? 0) * fps);
    const elapsed = frame - segment.lineDuration;
    if (elapsed < 0 || elapsed >= holdFrames) return undefined;
    return Math.ceil((holdFrames - elapsed) / fps);
  }
}
