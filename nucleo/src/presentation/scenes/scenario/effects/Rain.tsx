import type { FC } from 'react';
import { Particles } from '../../../../domain/scenario/Particles.ts';
import { Fps } from '../../../../domain/values/Time.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas } from './ParticleDots.tsx';

// The streaks lean like the drops' drift in the domain (0.08 of the width per fall).
const LEAN = 0.18;

/** Slanted streaks of rain over the whole frame; `intensity` scales how many (default 1 = 140 drops). */
export const Rain: FC<EffectProps> = ({ effect, aspect, frame, unit }) => {
  const [width, height] = [aspect.width(), aspect.height()];
  const count = Math.round(140 * (effect.intensity ?? 1));
  const drops = Particles.for('rain', { seed: 'rain', count }).at(frame, Fps.DEFAULT, { x: 0, y: -0.1 * height, width, height: height * 1.2 });
  return (
    <FrameCanvas width={width} height={height}>
      <g stroke={effect.color ?? '#cfd8ff'} strokeWidth={2.5 * unit} strokeLinecap="round">
        {drops.map((drop, index) => {
          const length = 60 * unit * drop.size;
          return <line key={index} x1={drop.x} y1={drop.y} x2={drop.x - length * LEAN} y2={drop.y - length} opacity={drop.opacity} />;
        })}
      </g>
    </FrameCanvas>
  );
};
