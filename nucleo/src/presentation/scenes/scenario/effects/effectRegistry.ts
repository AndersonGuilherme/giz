import type { Effect } from '../../../../domain/script/SceneElements.ts';
import type { EffectModel } from './EffectModel.ts';
import { Fire } from './Fire.tsx';
import { Glow } from './Glow.tsx';
import { Particles } from './Particles.tsx';
import { Rain } from './Rain.tsx';
import { Snow } from './Snow.tsx';
import { Tint } from './Tint.tsx';
import { Vignette } from './Vignette.tsx';

/** Every effect type with its drawing and its space; the record type makes every type of the script have one. */
export const effectRegistry: Readonly<Record<Effect['type'], EffectModel>> = {
  vignette: { Component: Vignette, space: 'screen' },
  glow: { Component: Glow, space: 'world' },
  particles: { Component: Particles, space: 'screen' },
  fire: { Component: Fire, space: 'world' },
  rain: { Component: Rain, space: 'screen' },
  snow: { Component: Snow, space: 'screen' },
  tint: { Component: Tint, space: 'screen' },
};
