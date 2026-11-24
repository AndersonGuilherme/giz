// Torso outlines in giz drawing units (shoulders at y 300, the center line at x 200).

/** A torso from the shoulders down to `hem`, `flare` units wider at the bottom on each side. */
export const torso = (hem: number, flare: number) =>
  `M126,300 C150,286 250,286 274,300 L${274 + flare},${hem} C240,${hem + 12} 160,${hem + 12} ${126 - flare},${hem} Z`;

/** A skirt from the waist (`top`) to `hem`, `flare` units wider at the bottom. */
export const skirt = (top: number, hem: number, flare: number) =>
  `M134,${top} L266,${top} L${266 + flare},${hem} C250,${hem + 14} 150,${hem + 14} ${134 - flare},${hem} Z`;

/** The two halves of an open coat, from the shoulders to `hem` (`gap`: how far apart they stay at the chest). */
export const coatHalves = (hem: number, gap: number): readonly [string, string] => [
  `M126,300 C140,292 160,288 ${200 - gap},292 L${196 - gap / 2},${hem + 6} L${112},${hem} Z`,
  `M274,300 C260,292 240,288 ${200 + gap},292 L${204 + gap / 2},${hem + 6} L${288},${hem} Z`,
];

export const SHIRT = torso(452, 10);
export const LONG_TOP = torso(470, 12);
export const TUNIC = torso(506, 22);
export const BODICE = 'M128,300 C150,286 250,286 272,300 L268,402 L132,402 Z';
export const V_NECK = 'M174,292 L200,336 L226,292 Z';
