import type { FC } from 'react';
import { BARE_LEGS, type OutfitPalette } from '../../../domain/character/wardrobe/OutfitDesign.ts';
import { Silhouette } from '../../../domain/drawing/Silhouette.ts';
import { Chalked } from './Chalked.tsx';
import { FEET } from './measures.ts';
import { OUTFIT_DRAWINGS } from './outfits/outfitDrawings.ts';
import { outfitPaletteOf, skinOf, type Look } from './parameters.ts';
import { shade } from '../svg.ts';

const LEFT_SHOE = `M140,${FEET.y} C140,560 196,556 198,578 L198,${FEET.y} Z`;
const RIGHT_SHOE = `M260,${FEET.y} C260,560 204,556 202,578 L202,${FEET.y} Z`;

type LegsProps = Readonly<{ hem: number; palette: OutfitPalette; look: Look }>;

const legColor = ({ palette, look }: LegsProps) => (palette.legs === BARE_LEGS ? skinOf(look).base : palette.legs);

const Leg: FC<LegsProps & Readonly<{ x: number; side: -1 | 1 }>> = (props) => {
  const rectangle = { x: props.x, y: props.hem - 12, width: 34, height: FEET.y - props.hem - 4 };
  return (
    <g>
      <rect {...rectangle} rx={14} fill={legColor(props)} />
      <Chalked look={props.look} outline={Silhouette.roundedRect(rectangle, 14)} part="leg" side={props.side} />
    </g>
  );
};

const Legs: FC<LegsProps> = (props) => (
  <g>
    <Leg {...props} x={160} side={-1} />
    <Leg {...props} x={206} side={1} />
    {([[LEFT_SHOE, -1], [RIGHT_SHOE, 1]] as const).map(([shoe, side]) => (
      <g key={shoe}>
        <path d={shoe} fill={props.palette.shoes} />
        <Chalked look={props.look} outline={Silhouette.parse(shoe)} part="shoe" side={side} />
      </g>
    ))}
    <rect x={138} y={FEET.y - 6} width={124} height={8} rx={4} fill={shade(props.palette.shoes, -0.35)} />
  </g>
);

/** Legs and torso for the chosen outfit in its palette (the arms draw their own sleeves). */
export const Outfit: FC<Readonly<{ look: Look }>> = ({ look }) => {
  const { hem, Torso } = OUTFIT_DRAWINGS[look.outfit];
  const palette = outfitPaletteOf(look);
  return (
    <g>
      <Legs hem={hem} palette={palette} look={look} />
      <Torso look={look} palette={palette} />
    </g>
  );
};
