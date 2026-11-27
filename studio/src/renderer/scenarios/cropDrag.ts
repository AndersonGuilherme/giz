import type { ImageCrop } from '../../shared/scenarios.ts';

type Size = Readonly<{ width: number; height: number }>;
type Range = Readonly<{ least: number; most: number }>;
/** Core's crop ranges (`CROP_LIMITS`, given by the editor: this module stays free of core for its tests). */
export type CropLimits = Readonly<{ zoom: Range; focus: Range }>;
/** The picture box on screen (the frame plus the camera margin) and the picture's own size, in pixels. */
export type CropShape = Readonly<{ box: Size; picture: Size; limits: CropLimits }>;

export const NO_CROP: ImageCrop = { zoom: 1, x: 0.5, y: 0.5 };
const within = ({ least, most }: Range, value: number) => Math.min(most, Math.max(least, value));
const hundredths = (value: number) => Math.round(value * 100) / 100;

// The picture covers a box `zoom` times the shown one: what it has beyond the shown box, on each axis, in pixels.
function spare(crop: ImageCrop, { box, picture }: CropShape): Size {
  const scale = crop.zoom * Math.max(box.width / picture.width, box.height / picture.height);
  return { width: picture.width * scale - box.width, height: picture.height * scale - box.height };
}

type Move = Readonly<{ pixels: number; room: number }>;
const moved = (focus: number, { pixels, room }: Move, range: Range) => (room < 0.5 ? focus : within(range, focus - pixels / room));

/** The crop after the picture was dragged by `dx`, `dy` pixels (to the right shows more of its left side). */
export function dragged(crop: ImageCrop, { dx, dy }: Readonly<{ dx: number; dy: number }>, shape: CropShape): ImageCrop {
  const room = spare(crop, shape);
  const { focus } = shape.limits;
  return { ...crop, x: hundredths(moved(crop.x, { pixels: dx, room: room.width }, focus)), y: hundredths(moved(crop.y, { pixels: dy, room: room.height }, focus)) };
}

/** The crop with another zoom (kept within core's limits, 1 to 4). */
export function zoomed(crop: ImageCrop, zoom: number, limits: CropLimits): ImageCrop {
  return { ...crop, zoom: hundredths(within(limits.zoom, zoom)) };
}
