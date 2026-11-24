import { Box, type Rectangle } from '../layout/Box.ts';
import type { Point } from '../script/SceneElements.ts';
import type { Spot } from './Placement.ts';

/** Where a rig draws: its SVG view box and the point between the soles, both in the rig's own units. */
export type StanceData = Readonly<{ viewBox: Rectangle; feet: Point }>;

/** Turns a spot on the scene floor into the rectangle the rig's SVG takes, so the soles rest on the ground line. */
export class Stance {
  readonly #data: StanceData;

  private constructor(data: StanceData) {
    this.#data = data;
  }

  static of(data: StanceData): Stance {
    return new Stance(data);
  }

  /** `spot.height` is the height of the whole SVG; the rectangle is in video pixels. */
  rectangleFor(spot: Spot): Rectangle {
    const { viewBox, feet } = this.#data;
    const scale = spot.height / viewBox.height;
    const left = spot.x - (feet.x - viewBox.x) * scale;
    const top = spot.y - (feet.y - viewBox.y) * scale;
    return { x: left, y: top, width: viewBox.width * scale, height: spot.height };
  }

  /** From the top of the drawing down to the soles: the shadow under the feet may spill below the ground line. */
  boxFor(spot: Spot): Box {
    const rectangle = this.rectangleFor(spot);
    return Box.of(`personagem ${spot.character}`, { ...rectangle, height: spot.y - rectangle.y });
  }
}
