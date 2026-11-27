import type { ImageCrop } from '../../shared/scenarios.ts';

type Size = Readonly<{ width: number; height: number }>;
/** The picture box on screen (the frame plus the camera margin) and the picture's own size, in pixels. */
export type CropShape = Readonly<{ box: Size; picture: Size }>;

export const NO_CROP: ImageCrop = { zoom: 1, x: 0.5, y: 0.5 };
const [LEAST_ZOOM, MOST_ZOOM] = [1, 4];
const within = (least: number, most: number, value: number) => Math.min(most, Math.max(least, value));
const hundredths = (value: number) => Math.round(value * 100) / 100;

// The picture covers a box `zoom` times the shown one: what it has beyond the shown box, on each axis, in pixels.
function spare(crop: ImageCrop, { box, picture }: CropShape): Size {
  const scale = crop.zoom * Math.max(box.width / picture.width, box.height / picture.height);
  return { width: picture.width * scale - box.width, height: picture.height * scale - box.height };
}

const moved = (focus: number, pixels: number, room: number) => (room < 0.5 ? focus : within(0, 1, focus - pixels / room));

/** The crop after the picture was dragged by `dx`, `dy` pixels (to the right shows more of its left side). */
export function dragged(crop: ImageCrop, { dx, dy }: Readonly<{ dx: number; dy: number }>, shape: CropShape): ImageCrop {
  const room = spare(crop, shape);
  return { ...crop, x: hundredths(moved(crop.x, dx, room.width)), y: hundredths(moved(crop.y, dy, room.height)) };
}

/** The crop with another zoom (kept from 1 to 4). */
export function zoomed(crop: ImageCrop, zoom: number): ImageCrop {
  return { ...crop, zoom: hundredths(within(LEAST_ZOOM, MOST_ZOOM, zoom)) };
}
