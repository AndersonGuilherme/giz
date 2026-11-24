import { Framing } from '../camera/Framing.ts';

/** 0 = back (sky, far walls), 1 = middle, 2 = front (the characters' plane and the foreground). */
export type Layer = 0 | 1 | 2;

const LAYER_FACTORS: Readonly<Record<Layer, number>> = { 0: 0.3, 1: 0.6, 2: 1 };

/** The background layers follow 0.3, 0.6 and 1.0 of the camera move: what is far moves less, which gives depth. */
export class Parallax {
  static offset(layer: Layer, camera: Framing): Framing {
    const factor = LAYER_FACTORS[layer];
    if (factor === 1) return camera;
    return Framing.of({
      zoom: 1 + (camera.zoom - 1) * factor,
      x: camera.x * factor,
      y: camera.y * factor,
      rotation: camera.rotation * factor,
    });
  }
}
