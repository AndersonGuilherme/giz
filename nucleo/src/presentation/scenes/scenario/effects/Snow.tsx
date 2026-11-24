import type { FC } from 'react';
import { EffectLooks } from '../../../../domain/scenario/EffectLooks.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas, ParticleDots } from './ParticleDots.tsx';

/** Snowflakes drifting down over the whole frame. */
export const Snow: FC<EffectProps> = ({ effect, aspect, frame }) => {
  const { particles, size } = EffectLooks.screenParticles(effect, aspect, frame);
  return (
    <FrameCanvas width={aspect.width()} height={aspect.height()}>
      <ParticleDots particles={particles} radius={size} color={effect.color ?? '#ffffff'} blur={1} />
    </FrameCanvas>
  );
};
