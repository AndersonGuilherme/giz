import type { FC } from 'react';
import { Silhouette } from '../../../../domain/drawing/Silhouette.ts';
import { shade } from '../../svg.ts';
import { Chalked } from '../Chalked.tsx';
import { OUTFIT_DRAWINGS } from '../outfits/outfitDrawings.ts';
import { outfitPaletteOf, skinOf } from '../parameters.ts';
import type { OverlayProps, SpeciesOverlay } from './SpeciesOverlay.ts';

// Torn notches along the hem (the skin shows through) and a rip on the chest.
const notches = (hem: number) => [
  `M148,${hem - 2} L156,${hem - 26} L164,${hem - 10} L171,${hem - 30} L180,${hem + 2} Z`,
  `M222,${hem + 2} L230,${hem - 22} L238,${hem - 8} L246,${hem - 24} L254,${hem - 2} Z`,
];
const RIP = 'M168,364 L182,354 L186,368 L198,362 L194,380 L182,392 L174,382 Z';
const PATCH = { x: 214, y: 392, width: 30, height: 26 } as const;

const TornClothes: FC<OverlayProps> = ({ look }) => {
  const [skin, palette] = [skinOf(look), outfitPaletteOf(look)];
  const hem = OUTFIT_DRAWINGS[look.outfit].hem;
  return (
    <g>
      {[...notches(hem), RIP].map((path, index) => (
        <g key={path}>
          <path d={path} fill={skin.base} />
          <Chalked look={look} outline={Silhouette.parse(path)} part={`rip-${index}`} width={3.5} />
        </g>
      ))}
      <rect {...PATCH} rx={4} fill={shade(palette.main, 0.35)} transform={`rotate(-8 ${PATCH.x} ${PATCH.y})`} />
      <path d={`M${PATCH.x + 4},${PATCH.y + 4} l6,6 M${PATCH.x + 24},${PATCH.y + 2} l-6,6 M${PATCH.x + 6},${PATCH.y + 22} l6,-6`} stroke={shade(palette.main, -0.4)} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
};

/** The zombie: a paler patch and dark stitches on the head, torn clothes on the body. */
export const zombie: SpeciesOverlay = {
  paints: (look) => {
    const skin = skinOf(look);
    return { patch: { fill: shade(skin.base, 0.22), width: 3 }, stitch: { fill: skin.line, opacity: 0.8, chalk: false } };
  },
  Body: TornClothes,
};
