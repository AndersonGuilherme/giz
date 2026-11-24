import type { SpeciesName } from '../../../../domain/character/species/Species.ts';
import { alien } from './alien.tsx';
import { ghost } from './ghost.tsx';
import { mummy } from './mummy.tsx';
import { robot } from './robot.tsx';
import { slimeMonster } from './slimeMonster.tsx';
import type { SpeciesOverlay } from './SpeciesOverlay.ts';
import { vampire } from './vampire.tsx';
import { werewolf } from './werewolf.tsx';
import { zombie } from './zombie.tsx';

/** What each species draws over the giz body, by name (a human draws nothing extra). */
export const SPECIES_OVERLAYS: Readonly<Record<SpeciesName, SpeciesOverlay>> = {
  human: {},
  zombie,
  vampire,
  werewolf,
  mummy,
  ghost,
  robot,
  alien,
  'slime-monster': slimeMonster,
};
