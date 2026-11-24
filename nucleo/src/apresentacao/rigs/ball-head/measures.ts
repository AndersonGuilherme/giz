// Drawing measures, in the ball-head SVG coordinate system (feet at y = 590).
export const VIEW_BOX = { x: -60, y: -30, width: 520, height: 630 } as const;
export const HEAD = { x: 200, y: 165, radius: 128 } as const;
/** Face unit: the domain geometries use head radius = 100. */
export const UNIT = HEAD.radius / 100;
export const EYES = { spacing: 50, y: 168, radiusX: 33, radiusY: 40, pupil: 14, travel: { x: 12, y: 14 } } as const;
/** The mouth draws the domain shapes larger than the face unit: big cartoon mouths read at small sizes. */
export const MOUTH = { y: 242, unit: UNIT * 1.7 } as const;
export const SHOULDERS = { left: { x: 140, y: 318 }, right: { x: 260, y: 318 } } as const;
export const ARM = { upper: 88, fore: 84, thickness: 32 } as const;
export const FEET = { y: 590 } as const;
export const NECK = { x: 200, y: 292 } as const;
