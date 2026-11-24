import type { VectorBackground } from '../../../../domain/scenario/BackgroundSource.ts';
import { field } from './field.tsx';
import { lab } from './lab.tsx';
import { nightSky } from './night-sky.tsx';
import { room } from './room.tsx';
import { street } from './street.tsx';
import type { VectorBackgroundModel } from './VectorBackgroundModel.ts';
import { village } from './village.tsx';

/** The vector backgrounds by name; the record type makes every name of the domain list have its drawing. */
export const backgroundRegistry: Readonly<Record<VectorBackground, VectorBackgroundModel>> = {
  room,
  street,
  field,
  'night-sky': nightSky,
  lab,
  village,
};
