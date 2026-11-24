import type { Rectangle } from '../layout/Box.ts';
import type { AspectRatio } from '../values/AspectRatio.ts';

// The content of a lesson scene, in video pixels, inside the safe area and above the caption box:
// 16:9 → right of the presenters' column (x 600, as in the motor) and above the caption (y ≥ 826);
// 9:16 → the whole width of the safe area, from its top down to the caption (y ≥ 1138), presenters below.
const HORIZONTAL: Rectangle = { x: 600, y: 54, width: 1224, height: 752 };
const VERTICAL: Rectangle = { x: 86, y: 250, width: 908, height: 864 };

/** Where the content of a lesson scene goes in each aspect ratio. */
export class LessonStage {
  readonly #content: Rectangle;

  private constructor(content: Rectangle) {
    this.#content = content;
  }

  static for(aspect: AspectRatio): LessonStage {
    return new LessonStage(aspect.vertical() ? VERTICAL : HORIZONTAL);
  }

  content(): Rectangle {
    return { ...this.#content };
  }
}
