import type { VectorBackground } from '../../../../domain/scenario/BackgroundSource.ts';
import { ancientEgypt } from './ancient-egypt.tsx';
import { ancientRome } from './ancient-rome.tsx';
import { cave } from './cave.tsx';
import { cityNight } from './city-night.tsx';
import { classroom } from './classroom.tsx';
import { cyberCity } from './cyber-city.tsx';
import { field } from './field.tsx';
import { fiftiesDiner } from './fifties-diner.tsx';
import { graveyard } from './graveyard.tsx';
import { hauntedHouse } from './haunted-house.tsx';
import { lab } from './lab.tsx';
import { medievalCastle } from './medieval-castle.tsx';
import { nightSky } from './night-sky.tsx';
import { office } from './office.tsx';
import { pirateShip } from './pirate-ship.tsx';
import { room } from './room.tsx';
import { spaceStation } from './space-station.tsx';
import { street } from './street.tsx';
import type { ColorsOf, VectorBackgroundModel } from './VectorBackgroundModel.ts';
import { victorianStreet } from './victorian-street.tsx';
import { village } from './village.tsx';

/**
 * The vector backgrounds by name: every name of the domain list has its drawing, and each drawing reads exactly the
 * colors of its own palette.
 */
export const backgroundRegistry: { readonly [B in VectorBackground]: VectorBackgroundModel<ColorsOf<B>> } = {
  room,
  street,
  field,
  'night-sky': nightSky,
  lab,
  village,
  cave,
  'ancient-egypt': ancientEgypt,
  'ancient-rome': ancientRome,
  'medieval-castle': medievalCastle,
  'pirate-ship': pirateShip,
  'victorian-street': victorianStreet,
  'fifties-diner': fiftiesDiner,
  classroom,
  office,
  'city-night': cityNight,
  'space-station': spaceStation,
  'cyber-city': cyberCity,
  graveyard,
  'haunted-house': hauntedHouse,
};
