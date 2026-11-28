import type { FC } from 'react';
import { Headwear as HeadwearDesigns } from '../../../../domain/character/headwear/Headwear.ts';
import type { HeadLayer } from '../../../../domain/character/HeadPart.ts';
import { HeadParts } from '../HeadParts.tsx';
import { headwearPaletteOf, type Look } from '../parameters.ts';
import { HEADWEAR_STYLES } from './headwearStyles.ts';

/** The headwear of the look on one layer, its shapes built on the head shape and painted by its style. */
export const Headwear: FC<Readonly<{ look: Look; layer: HeadLayer }>> = ({ look, layer }) => {
  const paints = HEADWEAR_STYLES[look.headwear](headwearPaletteOf(look));
  const parts = HeadwearDesigns.parts(look.headwear, look.headShape);
  return <HeadParts parts={parts} layer={layer} look={look} paint={(role) => paints[role] ?? paints.main!} group="headwear" />;
};
