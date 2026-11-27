import type { AspectRatio } from '../values/AspectRatio.ts';

/** A size in pixels. */
export type PixelSize = Readonly<{ width: number; height: number }>;

/**
 * A scenario image covers the frame plus this fraction of it on each side (12% larger in all), so the camera can move
 * without showing its edge. The renderer draws it that way, and the generated images are made that large.
 */
export const IMAGE_BLEED = 0.06;

// Image services ask for sides in multiples of 16 pixels; rounding both up keeps the aspect within a fraction of a %.
const GRID = 16;
const SCALE = 1 + 2 * IMAGE_BLEED;
const onGrid = (pixels: number): number => Math.ceil(pixels / GRID) * GRID;

/** The size of a scenario image and where the video frame falls inside it. */
export class ScenarioImageFrame {
  /** The frame of the aspect plus the bleed on every side (1216×2160 for 9:16, 2160×1216 for 16:9). */
  static sizeFor(aspect: AspectRatio): PixelSize {
    return { width: onGrid(aspect.width() * SCALE), height: onGrid(aspect.height() * SCALE) };
  }

  /** Where a point of the frame (a fraction of its side, from 0 to 1) falls in the image, as a fraction of its side. */
  static inImage(fraction: number): number {
    return (fraction + IMAGE_BLEED) / SCALE;
  }
}
