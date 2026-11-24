import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import type { EffectProps } from './EffectModel.ts';

/** Grades the whole frame toward a color (warm by default); `intensity` 0–1 (default 0.35). */
export const Tint: FC<EffectProps> = ({ effect }) => (
  <AbsoluteFill style={{ background: effect.color ?? '#ff9a4a', opacity: effect.intensity ?? 0.35, mixBlendMode: 'soft-light' }} />
);
