import type { FC } from 'react';
import type { OutfitPalette } from '../../../../domain/character/wardrobe/OutfitDesign.ts';
import { Silhouette } from '../../../../domain/drawing/Silhouette.ts';
import { shade, useSvgId } from '../../svg.ts';
import { Chalked } from '../Chalked.tsx';
import type { Look } from '../parameters.ts';

/** What every outfit drawing receives: the look (for the chalk seed and skin) and the outfit's resolved palette. */
export type ClothesProps = Readonly<{ look: Look; palette: OutfitPalette }>;

/** An outfit drawing: the torso garments and where they end (the legs start under `hem`). */
export type Clothes = Readonly<{ hem: number; Torso: FC<ClothesProps> }>;

type GarmentProps = Readonly<{ path: string; color: string; look: Look; part: string }>;

// The side away from the light gets a darker band; the head casts a soft shadow on the chest; chalk around it all.
export const Garment: FC<GarmentProps> = ({ path, color, look, part }) => {
  const clip = useSvgId('garment');
  return (
    <g>
      <clipPath id={clip}><path d={path} /></clipPath>
      <path d={path} fill={color} />
      <g clipPath={`url(#${clip})`}>
        <path d="M236,280 C262,300 270,340 272,380 L300,580 L250,580 C256,460 254,360 236,280 Z" fill={shade(color, -0.18)} />
        <ellipse cx={200} cy={298} rx={84} ry={24} fill="#000000" opacity={0.2} />
      </g>
      <Chalked look={look} outline={Silhouette.parse(path)} part={part} />
    </g>
  );
};

/** A flat piece on top of a garment (collar, panel, pocket), with a thinner chalk line. */
export const Patch: FC<GarmentProps & Readonly<{ width?: number }>> = ({ path, color, look, part, width = 4 }) => (
  <g>
    <path d={path} fill={color} />
    <Chalked look={look} outline={Silhouette.parse(path)} part={part} width={width} />
  </g>
);
