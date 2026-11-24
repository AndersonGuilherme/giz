import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import type { EffectProps } from './EffectModel.ts';

/** Darkens the edges: the eye goes to the middle of the frame. `intensity` 0–1 (default 0.7). */
export const Vignette: FC<EffectProps> = ({ effect }) => {
  const strength = effect.intensity ?? 0.7;
  const color = effect.color ?? '#0b0604';
  const gradient = `radial-gradient(ellipse 75% 70% at 50% 48%, transparent 38%, ${color} 108%)`;
  return <AbsoluteFill style={{ background: gradient, opacity: Math.min(1, strength * 1.25), pointerEvents: 'none' }} />;
};
