import type { FC } from 'react';
import { EffectLooks } from '../../../../domain/scenario/EffectLooks.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas } from './ParticleDots.tsx';

// Drawing only: the streak leans like the drops' drift in the domain (0.08 of the width per fall).
const LEAN = 0.18;

/** Slanted streaks of rain over the whole frame; the streak length is the drop's size. */
export const Rain: FC<EffectProps> = ({ effect, aspect, frame, unit }) => {
  const { particles, size } = EffectLooks.screenParticles(effect, aspect, frame);
  return (
    <FrameCanvas width={aspect.width()} height={aspect.height()}>
      <g stroke={effect.color ?? '#cfd8ff'} strokeWidth={2.5 * unit} strokeLinecap="round">
        {particles.map((drop, index) => {
          const length = size * drop.size;
          return <line key={index} x1={drop.x} y1={drop.y} x2={drop.x - length * LEAN} y2={drop.y - length} opacity={drop.opacity} />;
        })}
      </g>
    </FrameCanvas>
  );
};
