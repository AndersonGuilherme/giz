import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { EffectLooks } from '../../../../domain/scenario/EffectLooks.ts';
import type { EffectProps } from './EffectModel.ts';

/** A soft light that breathes a little, added over the scene (screen blend). */
export const Glow: FC<EffectProps> = ({ effect, aspect, frame }) => {
  const { center, radius, opacity } = EffectLooks.glow(effect, aspect, frame);
  const gradient = `radial-gradient(circle ${radius}px at ${center.x}px ${center.y}px, ${effect.color ?? '#ffb45c'}, transparent)`;
  return <AbsoluteFill style={{ background: gradient, opacity, mixBlendMode: 'screen' }} />;
};
