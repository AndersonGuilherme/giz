import type { FC } from 'react';
import { Species } from '../../../../domain/character/species/Species.ts';
import { useSvgId } from '../../svg.ts';
import { skinOf, type Look } from '../parameters.ts';

type Rectangle = Readonly<{ x: number; y: number; width: number; height: number }>;
type LimbWrapsProps = Readonly<{ look: Look; rectangle: Rectangle; corner: number }>;

// How far a wrap slants across the limb, in drawing units.
const SLANT = 5;

/** The species' bandage wraps across one limb (arm or leg) or the torso, clipped to it; nothing for most species. */
export const LimbWraps: FC<LimbWrapsProps> = ({ look, rectangle, corner }) => {
  const clip = useSvgId('wraps');
  const wraps = Species.wraps(look.species, rectangle.height);
  if (wraps.length === 0) return null;
  const { x, y, width } = rectangle;
  const path = wraps.map(({ at, slant }) => `M${x - 2},${y + at + slant * SLANT} L${x + width + 2},${y + at - slant * SLANT}`).join(' ');
  return (
    <g>
      <clipPath id={clip}><rect {...rectangle} rx={corner} /></clipPath>
      <path d={path} clipPath={`url(#${clip})`} fill="none" stroke={skinOf(look).shade} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};
