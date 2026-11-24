import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { EffectLooks } from '../../../../domain/scenario/EffectLooks.ts';
import type { EffectProps } from './EffectModel.ts';

/** Grades the whole frame toward a color (warm by default). */
export const Tint: FC<EffectProps> = ({ effect }) => (
  <AbsoluteFill style={{ background: effect.color ?? '#ff9a4a', opacity: EffectLooks.tint(effect), mixBlendMode: 'soft-light' }} />
);
