import type { FC } from 'react';
import { Particles } from '../../../../domain/scenario/Particles.ts';
import { Fps } from '../../../../domain/values/Time.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas, ParticleDots } from './ParticleDots.tsx';

/** Snowflakes drifting down over the whole frame; `intensity` scales how many (default 1 = 90 flakes). */
export const Snow: FC<EffectProps> = ({ effect, aspect, frame, unit }) => {
  const [width, height] = [aspect.width(), aspect.height()];
  const count = Math.round(90 * (effect.intensity ?? 1));
  const flakes = Particles.for('snow', { seed: 'snow', count }).at(frame, Fps.DEFAULT, { x: 0, y: -0.05 * height, width, height: height * 1.1 });
  return (
    <FrameCanvas width={width} height={height}>
      <ParticleDots particles={flakes} radius={7 * unit} color={effect.color ?? '#ffffff'} blur={1} />
    </FrameCanvas>
  );
};
