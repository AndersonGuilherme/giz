// Drawing measures, in the giz SVG coordinate system (feet at y = 590).
export const VIEW_BOX = { x: -60, y: -30, width: 520, height: 630 } as const;
export const HEAD = { x: 200, y: 165, radius: 128 } as const;
/** Face unit: the domain geometries use head radius = 100. */
export const UNIT = HEAD.radius / 100;
/** Rounded-rectangle eyes with a colored iris, a pupil and a highlight; `travel` is how far the iris follows the gaze. */
export const EYES = { spacing: 50, y: 164, width: 54, height: 64, corner: 21, iris: 19, pupil: 9, travel: { x: 10, y: 11 } } as const;
export const NOSE = { y: 210, radiusX: 8, radiusY: 6 } as const;
export const CHEEKS = { x: 80, y: 220, radiusX: 21, radiusY: 12 } as const;
/** Freckles around each cheek (left side; the right side mirrors them), offsets from the cheek center. */
export const FRECKLES = [[-12, -10], [2, -14], [14, -8], [-4, -2], [10, 2]] as const;
/** The mouth draws the domain shapes larger than the face unit: big cartoon mouths read at small sizes. */
export const MOUTH = { y: 244, unit: UNIT * 1.7 } as const;
export const SHOULDERS = { left: { x: 140, y: 318 }, right: { x: 260, y: 318 } } as const;
export const ARM = { upper: 88, fore: 84, thickness: 32 } as const;
export const FEET = { y: 590 } as const;
export const NECK = { x: 200, y: 292 } as const;
/** Width of the chalk outline, in drawing units. */
export const CHALK_WIDTH = 6;
