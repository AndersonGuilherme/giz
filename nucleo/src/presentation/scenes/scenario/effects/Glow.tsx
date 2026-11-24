import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { EffectCenter } from '../../../../domain/scenario/EffectCenter.ts';
import { Flicker } from '../../../../domain/scenario/Flicker.ts';
import type { EffectProps } from './EffectModel.ts';

/** A soft light that breathes a little, added over the scene (screen blend); `intensity` 0–1 (default 0.6). */
export const Glow: FC<EffectProps> = ({ effect, aspect, frame, unit }) => {
  const center = EffectCenter.of(effect, aspect);
  const radius = 620 * unit;
  const brightness = (effect.intensity ?? 0.6) * (0.85 + 0.15 * Flicker.for('glow').at(frame));
  const gradient = `radial-gradient(circle ${radius}px at ${center.x}px ${center.y}px, ${effect.color ?? '#ffb45c'}, transparent)`;
  return <AbsoluteFill style={{ background: gradient, opacity: brightness, mixBlendMode: 'screen' }} />;
};
