import type { CSSProperties } from 'react';
import { ImageCrop, type ImageCropJson } from '../../../domain/scenario/ImageCrop.ts';

/**
 * The style of a scenario picture inside its box (the frame plus the camera margin): the part the person chose
 * (`crop`) covers the box; without a crop, the whole picture covers it, centered. The render and the Studio's crop
 * editor and thumbnails use this same style, so what is chosen is what is rendered.
 */
export function cropStyle(crop: ImageCropJson | undefined): CSSProperties {
  const { size, left, top, focusX, focusY } = (crop ? ImageCrop.of(crop) : ImageCrop.none()).placement();
  return { position: 'absolute', left: `${left}%`, top: `${top}%`, width: `${size}%`, height: `${size}%`, objectFit: 'cover', objectPosition: `${focusX}% ${focusY}%` };
}
