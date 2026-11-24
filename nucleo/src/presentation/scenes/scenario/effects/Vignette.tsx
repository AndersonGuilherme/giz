import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { EffectLooks } from '../../../../domain/scenario/EffectLooks.ts';
import type { EffectProps } from './EffectModel.ts';

/** Darkens the edges: the eye goes to the middle of the frame. */
export const Vignette: FC<EffectProps> = ({ effect }) => {
  const gradient = `radial-gradient(ellipse 75% 70% at 50% 48%, transparent 38%, ${effect.color ?? '#0b0604'} 108%)`;
  return <AbsoluteFill style={{ background: gradient, opacity: EffectLooks.vignette(effect), pointerEvents: 'none' }} />;
};
