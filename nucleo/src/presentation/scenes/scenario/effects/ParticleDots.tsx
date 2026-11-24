import type { FC } from 'react';
import type { Particle } from '../../../../domain/scenario/Particles.ts';

type DotsProps = Readonly<{ particles: readonly Particle[]; radius: number; color: string; blur?: number }>;

/** Round particles (embers, snow, dust) already placed in video pixels. */
export const ParticleDots: FC<DotsProps> = ({ particles, radius, color, blur = 0 }) => (
  <g fill={color} style={{ filter: blur ? `blur(${blur}px)` : undefined }}>
    {particles.map((particle, index) => (
      <circle key={index} cx={particle.x} cy={particle.y} r={radius * particle.size} opacity={particle.opacity} />
    ))}
  </g>
);

/** An SVG over the whole frame, in video pixels. */
export const FrameCanvas: FC<Readonly<{ width: number; height: number; children: React.ReactNode }>> = ({ width, height, children }) => (
  <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
    {children}
  </svg>
);
