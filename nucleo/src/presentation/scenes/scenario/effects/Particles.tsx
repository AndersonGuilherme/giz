import type { FC } from 'react';
import { Particles as ParticleField } from '../../../../domain/scenario/Particles.ts';
import { Fps } from '../../../../domain/values/Time.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas, ParticleDots } from './ParticleDots.tsx';

/** Dust floating in the light, over the whole frame; `intensity` scales how many (default 1 = 50 specks). */
export const Particles: FC<EffectProps> = ({ effect, aspect, frame, unit }) => {
  const [width, height] = [aspect.width(), aspect.height()];
  const count = Math.round(50 * (effect.intensity ?? 1));
  const specks = ParticleField.for('dust', { seed: 'particles', count }).at(frame, Fps.DEFAULT, { x: 0, y: 0, width, height });
  return (
    <FrameCanvas width={width} height={height}>
      <ParticleDots particles={specks} radius={5 * unit} color={effect.color ?? '#ffe9b8'} blur={1.5} />
    </FrameCanvas>
  );
};
