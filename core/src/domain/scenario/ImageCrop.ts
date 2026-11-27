import { DomainError } from '../DomainError.ts';

/** The framing the person chose for a scenario picture: `zoom` (1 to 4) and the focus, x and y from 0 to 1 (0.5 is the middle). */
export type ImageCropJson = Readonly<{ zoom: number; x: number; y: number }>;
type Focus = Readonly<{ x: number; y: number }>;

/**
 * How the picture sits in its box (the frame plus the camera margin), in % of the box: `size` (width and height),
 * `left` and `top`; `focusX`/`focusY`: where it is anchored when it covers the box (CSS object-position).
 */
export type CropPlacement = Readonly<{ size: number; left: number; top: number; focusX: number; focusY: number }>;

/** The crop's ranges (zoom; focus x and y), shared with the Studio's channel check and its crop editor. */
export const CROP_LIMITS = { zoom: { least: 1, most: 4 }, focus: { least: 0, most: 1 } } as const;
const HUNDRED = 100;
const rangeOf = ({ least, most }: Readonly<{ least: number; most: number }>): readonly [number, number] => [least, most];

function checked(name: string, value: number, [least, most]: readonly [number, number]): number {
  if (!Number.isFinite(value) || value < least || value > most) throw new DomainError(`recorte: ${name} deve ir de ${least} a ${most} (veio ${value})`);
  return value;
}

/**
 * A non-destructive crop of a scenario picture: the file stays as it is and the renderer draws the chosen part. The
 * picture always covers the whole box (the frame plus the camera margin), so neither its edge nor a gap ever shows.
 */
export class ImageCrop {
  readonly #zoom: number;
  readonly #focus: Focus;

  private constructor(zoom: number, focus: Focus) {
    this.#zoom = zoom;
    this.#focus = focus;
  }

  static of(json: ImageCropJson): ImageCrop {
    const focus = { x: checked('x', json.x, rangeOf(CROP_LIMITS.focus)), y: checked('y', json.y, rangeOf(CROP_LIMITS.focus)) };
    return new ImageCrop(checked('zoom', json.zoom, rangeOf(CROP_LIMITS.zoom)), focus);
  }

  static none(): ImageCrop {
    return new ImageCrop(1, { x: 0.5, y: 0.5 });
  }

  // The picture is `zoom` times the box; the part beyond the box is split by the focus (0: all of it to the right).
  placement(): CropPlacement {
    const extra = (this.#zoom - 1) * HUNDRED;
    const [x, y] = [this.#focus.x, this.#focus.y];
    return { size: this.#zoom * HUNDRED, left: 0 - extra * x, top: 0 - extra * y, focusX: x * HUNDRED, focusY: y * HUNDRED };
  }

  toJson(): ImageCropJson {
    return { zoom: this.#zoom, x: this.#focus.x, y: this.#focus.y };
  }
}
