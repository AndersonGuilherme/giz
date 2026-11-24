import { Box, type Rectangle } from '../layout/Box.ts';
import { Boxes } from '../layout/Boxes.ts';
import { Font } from '../layout/Font.ts';
import { TextFit, type Fit } from '../layout/TextFit.ts';
import type { BigText } from '../script/SceneElements.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';
import type { Frame } from '../values/Time.ts';

/** Where the big text goes, at which size and in which lines; `boxes()` is what the `check` sees. */
export type BigTextDrawing = Readonly<{ rectangle: Rectangle; fit: Fit; font: Font; boxes: () => Boxes }>;

// Below the HUD and above the caption: 9:16 → y 440–818; 16:9 → y 260–554, on the left, clear of the characters.
const VERTICAL = { column: { x: 86, y: 440, width: 908 }, font: Font.of({ family: 'display', size: 120, lineHeight: 1.05, maximumLines: 3 }) };
const HORIZONTAL = { column: { x: 96, y: 260, width: 1100 }, font: Font.of({ family: 'display', size: 140, lineHeight: 1.05, maximumLines: 2 }) };

export class BigTextLayout {
  static for(bigText: BigText, aspect: AspectRatio): BigTextDrawing {
    const { column, font } = aspect.vertical() ? VERTICAL : HORIZONTAL;
    const rectangle = { ...column, height: font.maximumHeight() };
    // Fitted narrower than the box by the pop overshoot, so the peak of the entrance still stays inside it.
    const fit = TextFit.measure(bigText.text, font, column.width / Entrance.peakScale());
    return { rectangle, fit, font, boxes: () => Boxes.of([Box.withText('destaque', rectangle, { text: bigText.text, font })]) };
  }
}

/** How the text looks in a frame of its entrance: `y` in pixels (positive = below its place). */
export type EntranceStep = Readonly<{ scale: number; y: number; opacity: number }>;
type Curve = (frame: number) => EntranceStep;

const progress = (frame: number, frames: number): number => Math.max(0, Math.min(1, frame / frames));
// The overshoot of "ease out back": goes a little past 1 and settles.
const OVERSHOOT = 1.70158;
const easeOutBack = (fraction: number): number => 1 + (OVERSHOOT + 1) * (fraction - 1) ** 3 + OVERSHOOT * (fraction - 1) ** 2;
const easeOutCubic = (fraction: number): number => 1 - (1 - fraction) ** 3;
const RISE_IN_PIXELS = 80;
// Every entrance has settled by then.
const ENTRANCE_FRAMES = 30;

const CURVES: ReadonlyMap<string, Curve> = new Map<string, Curve>([
  ['pop', (frame) => ({ scale: 0.6 + 0.4 * easeOutBack(progress(frame, 10)), y: 0, opacity: progress(frame, 5) })],
  ['rise', (frame) => ({ scale: 1, y: RISE_IN_PIXELS * (1 - easeOutCubic(progress(frame, 14))), opacity: progress(frame, 8) })],
]);

/** The entrance of the big text: `pop` (grows with a small bounce, the default) or `rise` (comes up from below). */
export class Entrance {
  readonly #curve: Curve;

  private constructor(curve: Curve) {
    this.#curve = curve;
  }

  static of(kind: BigText['entrance']): Entrance {
    return new Entrance(CURVES.get(kind ?? 'pop') ?? CURVES.get('pop')!);
  }

  /** The largest scale any entrance reaches (the pop overshoot): the layout leaves room for it. */
  static peakScale(): number {
    const frames = Array.from({ length: ENTRANCE_FRAMES }, (_empty, frame) => frame);
    return Math.max(...[...CURVES.values()].flatMap((curve) => frames.map((frame) => curve(frame).scale)));
  }

  /** `frame` counted from the start of the scene. */
  at(frame: Frame): EntranceStep {
    return this.#curve(frame.value());
  }
}
