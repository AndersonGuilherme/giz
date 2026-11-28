import type { HeadwearName } from '../../../../domain/character/headwear/Headwear.ts';
import { beret } from './beret.ts';
import { cap } from './cap.ts';
import { chefHat } from './chefHat.ts';
import { crown } from './crown.ts';
import { flatCap } from './flatCap.ts';
import { hardHat } from './hardHat.ts';
import { hat } from './hat.ts';
import { headphones } from './headphones.ts';
import { basePaints, type HeadwearStyle } from './HeadwearStyle.ts';
import { knightHelmet } from './knightHelmet.ts';
import { laurel } from './laurel.ts';
import { pirateHat } from './pirateHat.ts';
import { scarf } from './scarf.ts';
import { spaceHelmet } from './spaceHelmet.ts';
import { topHat } from './topHat.ts';
import { vikingHelmet } from './vikingHelmet.ts';
import { visor } from './visor.ts';
import { witchHat } from './witchHat.ts';

/** How each piece of headwear is painted, by name. */
export const HEADWEAR_STYLES: Readonly<Record<HeadwearName, HeadwearStyle>> = {
  none: basePaints,
  crown,
  laurel,
  'viking-helmet': vikingHelmet,
  'knight-helmet': knightHelmet,
  'pirate-hat': pirateHat,
  'top-hat': topHat,
  'flat-cap': flatCap,
  beret,
  cap,
  'chef-hat': chefHat,
  'hard-hat': hardHat,
  'space-helmet': spaceHelmet,
  visor,
  headphones,
  'witch-hat': witchHat,
  hat,
  scarf,
};
