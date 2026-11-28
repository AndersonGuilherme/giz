import type { OutfitName } from '../../../../domain/character/wardrobe/Wardrobe.ts';
import { cyber } from './future/cyber.tsx';
import { robotArmor } from './future/robotArmor.tsx';
import { spacesuit } from './future/spacesuit.tsx';
import { utopian } from './future/utopian.tsx';
import type { Clothes } from './Garment.tsx';
import { ancientEgypt } from './past/ancientEgypt.tsx';
import { caveman } from './past/caveman.tsx';
import { commoner } from './past/commoner.tsx';
import { fifties } from './past/fifties.tsx';
import { knight } from './past/knight.tsx';
import { pirate } from './past/pirate.tsx';
import { renaissance } from './past/renaissance.tsx';
import { toga } from './past/toga.tsx';
import { twenties } from './past/twenties.tsx';
import { victorian } from './past/victorian.tsx';
import { viking } from './past/viking.tsx';
import { athlete } from './present/athlete.tsx';
import { casual } from './present/casual.tsx';
import { chef } from './present/chef.tsx';
import { dress } from './present/dress.tsx';
import { hiVis } from './present/hiVis.tsx';
import { hoodie } from './present/hoodie.tsx';
import { labCoat } from './present/labCoat.tsx';
import { schoolUniform } from './present/schoolUniform.tsx';
import { scrubs } from './present/scrubs.tsx';
import { suit } from './present/suit.tsx';

/** The drawing of each outfit, by name. */
export const OUTFIT_DRAWINGS: Readonly<Record<OutfitName, Clothes>> = {
  caveman, 'ancient-egypt': ancientEgypt, toga, viking, knight, commoner, renaissance, pirate, victorian, '1920s': twenties, '1950s': fifties,
  casual, hoodie, dress, suit, 'school-uniform': schoolUniform, 'lab-coat': labCoat, scrubs, chef, athlete, 'hi-vis': hiVis,
  spacesuit, cyber, 'robot-armor': robotArmor, utopian,
};
