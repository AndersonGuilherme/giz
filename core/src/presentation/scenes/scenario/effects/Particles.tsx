import type { FC } from 'react';
import { EffectLooks } from '../../../../domain/scenario/EffectLooks.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas, ParticleDots } from './ParticleDots.tsx';

/** Dust floating in the light, over the whole frame. */
export const Particles: FC<EffectProps> = ({ effect, aspect, frame }) => {
  const { particles, size } = EffectLooks.screenParticles(effect, aspect, frame);
  return (
    <FrameCanvas width={aspect.width()} height={aspect.height()}>
      <ParticleDots particles={particles} radius={size} color={effect.color ?? '#ffe9b8'} blur={1.5} />
    </FrameCanvas>
  );
};
