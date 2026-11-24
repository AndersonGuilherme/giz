import type { FC } from 'react';
import { Silhouette } from '../../../../domain/drawing/Silhouette.ts';
import { shade } from '../../svg.ts';
import { Chalked } from '../Chalked.tsx';
import { FEET } from '../measures.ts';
import { skinOf } from '../parameters.ts';
import type { OverlayProps, SpeciesOverlay } from './SpeciesOverlay.ts';

// A soft blob from the neck down, bulging out and spreading into a puddle on the ground, with a glossy streak,
// two darker drips and a few bubbles.
const BLOB = `M152,282 C100,292 72,370 68,440 C64,500 40,540 50,568 C60,${FEET.y - 2} 120,${FEET.y + 6} 200,${FEET.y + 6}`
  + ` C280,${FEET.y + 6} 340,${FEET.y - 2} 350,568 C360,540 336,500 332,440 C328,370 300,292 248,282 Z`;
const SHADE = 'M262,296 C306,330 322,420 330,520 L290,540 C288,450 276,360 236,296 Z';
const STREAK = 'M98,400 C88,440 84,490 80,526 C92,500 100,450 108,404 Z';
const DRIPS = ['M168,470 C164,492 168,512 174,522 C182,512 182,492 178,470 Z', 'M226,494 C222,512 226,528 232,536 C240,528 240,512 236,494 Z'];
const BUBBLES = [[116, 500, 9], [292, 452, 6], [276, 540, 10], [146, 556, 5]] as const;

const Blob: FC<OverlayProps> = ({ look }) => {
  const skin = skinOf(look);
  return (
    <g>
      <ellipse cx={200} cy={FEET.y} rx={160} ry={14} fill={skin.shade} />
      <path d={BLOB} fill={skin.base} />
      <path d={SHADE} fill={skin.shade} opacity={0.6} />
      <path d={STREAK} fill="#ffffff" opacity={0.4} />
      {DRIPS.map((path) => <path key={path} d={path} fill={skin.shade} />)}
      {BUBBLES.map(([x, y, radius]) => <circle key={`${x}`} cx={x} cy={y} r={radius} fill="none" stroke={shade(skin.base, 0.5)} strokeWidth={3} />)}
      <Chalked look={look} outline={Silhouette.parse(BLOB)} part="blob" />
    </g>
  );
};

/** The slime monster: goo drips on the head, a glossy shine, and a blob body with drips and bubbles. */
export const slimeMonster: SpeciesOverlay = {
  paints: (look) => ({ goo: { fill: skinOf(look).base, chalk: false }, shine: { fill: '#ffffff', opacity: 0.5, chalk: false } }),
  Body: Blob,
  mouth: { inside: '#2f5418' },
};
