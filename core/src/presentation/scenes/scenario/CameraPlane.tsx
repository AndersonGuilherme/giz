import type { FC, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import type { Framing } from '../../../domain/camera/Framing.ts';

/** A full-frame plane moved by a framing (the camera, or a parallax layer's share of it). */
export const CameraPlane: FC<Readonly<{ framing: Framing; children: ReactNode }>> = ({ framing, children }) => (
  <AbsoluteFill style={{ transform: framing.cssTransform(), transformOrigin: '50% 50%' }}>{children}</AbsoluteFill>
);
