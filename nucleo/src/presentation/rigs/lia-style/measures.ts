// Drawing measures, in the old motor's 400 × 600 coordinates (feet on the ground at y = 570).
/** The same frame as the ball-head, so the character sheet places both rigs alike. */
export const VIEW_BOX = { x: -60, y: -30, width: 520, height: 630 } as const;
export const HEAD = { x: 200, y: 180, radiusX: 114, radiusY: 116 } as const;
export const EARS = { left: 92, right: 308, y: 200 } as const;
/** Pivots: the head tilts around the neck, the body leans around the feet. */
export const NECK = { x: 200, y: 290 } as const;
export const FEET = { x: 200, y: 575 } as const;
/** `rest` is the shoulder's own angle with the arm hanging (degrees), added to the pose angle. */
export const SHOULDERS = { left: { x: 134, y: 306, rest: 8 }, right: { x: 266, y: 306, rest: -8 } } as const;
export const ARM = { upper: 52, hand: 62 } as const;
export const EYES = { left: 152, right: 248, y: 196, radius: 24 } as const;
export const BROWS = { y: 136, halfWidth: 24 } as const;
export const MOUTH = { x: 200, y: 242 } as const;
