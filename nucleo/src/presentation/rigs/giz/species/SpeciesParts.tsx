import type { FC } from 'react';
import type { HeadLayer } from '../../../../domain/character/HeadPart.ts';
import { Species } from '../../../../domain/character/species/Species.ts';
import { HeadParts, type Paint } from '../HeadParts.tsx';
import { skinOf, type Look } from '../parameters.ts';
import { SPECIES_OVERLAYS } from './speciesOverlays.ts';
import type { OverlayProps } from './SpeciesOverlay.ts';

/** The species' features on one layer of the head (ears, stitches, bandages, antennae…), painted by the species. */
export const SpeciesHead: FC<Readonly<{ look: Look; layer: HeadLayer }>> = ({ look, layer }) => {
  const paints = SPECIES_OVERLAYS[look.species].paints?.(look) ?? {};
  const fallback: Paint = { fill: skinOf(look).base };
  const parts = Species.parts(look.species, look.headShape);
  return <HeadParts parts={parts} layer={layer} look={look} paint={(role) => paints[role] ?? fallback} group="species" />;
};

/** What the species draws behind the body (a cape). */
export const SpeciesBehind: FC<OverlayProps> = ({ look }) => {
  const { Behind } = SPECIES_OVERLAYS[look.species];
  return Behind ? <Behind look={look} /> : null;
};

/** What the species draws over the torso and legs, or in their place (rips, wraps, a sheet, a blob). */
export const SpeciesBody: FC<OverlayProps> = ({ look }) => {
  const { Body } = SPECIES_OVERLAYS[look.species];
  return Body ? <Body look={look} /> : null;
};
