import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { EffectCenter } from '../../../../domain/scenario/EffectCenter.ts';
import { Flicker } from '../../../../domain/scenario/Flicker.ts';
import { Particles } from '../../../../domain/scenario/Particles.ts';
import type { Point } from '../../../../domain/script/SceneElements.ts';
import { Fps, type Frame } from '../../../../domain/values/Time.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas, ParticleDots } from './ParticleDots.tsx';

// A campfire in units, burning on (0, 0): stones, crossed logs and three rings of flame tongues (outer to core).
const TONGUES = [
  { x: -52, width: 28, height: 115 },
  { x: -24, width: 36, height: 175 },
  { x: 2, width: 46, height: 235 },
  { x: 30, width: 36, height: 165 },
  { x: 54, width: 26, height: 105 },
] as const;
const RINGS = [
  { color: '#ff5a1a', scale: 1 },
  { color: '#ffa328', scale: 0.7 },
  { color: '#ffe58a', scale: 0.4 },
] as const;

type Tongue = Readonly<{ x: number; width: number; height: number; lean: number }>;

// A teardrop standing on its base, pointed at the top; `lean` moves the tip sideways (a fraction of the width).
function tongue({ x, width, height, lean }: Tongue): string {
  const tip = x + lean * width * 1.6;
  const sides = `C ${x - width} ${-height * 0.3} ${x - width * 0.55} ${-height * 0.62} ${tip} ${-height} C ${x + width * 0.55} ${-height * 0.62} ${x + width} ${-height * 0.3} ${x + width} 0`;
  return `M ${x - width} 0 ${sides} Q ${x} ${width * 0.7} ${x - width} 0 Z`;
}

// The flicker (0.6–1) stretches each tongue and swings its tip; every tongue has its own seed.
function tongues(frame: Frame, scale: number): string {
  return TONGUES.map(({ x, width, height }, index) => {
    const stretch = Flicker.for(`tongue-${index}`).at(frame) / 0.85;
    const lean = (Flicker.for(`lean-${index}`).at(frame) - 0.82) * 2.5;
    return tongue({ x: x * scale, width: width * scale, height: height * scale * stretch, lean });
  }).join(' ');
}

const Flames: FC<Readonly<{ frame: Frame }>> = ({ frame }) => (
  <g>
    <ellipse cx={0} cy={-90} rx={110} ry={150} fill="#ff7a22" opacity={0.35} style={{ filter: 'blur(18px)' }} />
    <g style={{ filter: 'blur(1.2px)' }}>
      {RINGS.map(({ color, scale }) => <path key={color} fill={color} d={tongues(frame, scale)} />)}
    </g>
  </g>
);

const Hearth: FC = () => (
  <g>
    <ellipse cx={0} cy={6} rx={150} ry={28} fill="#140b07" opacity={0.6} />
    {[-120, -70, -10, 55, 110].map((x) => <ellipse key={x} cx={x} cy={4} rx={34} ry={20} fill="#5b4a40" />)}
    <rect x={-120} y={-26} width={240} height={34} rx={17} fill="#4a2a18" transform="rotate(-12)" />
    <rect x={-120} y={-26} width={240} height={34} rx={17} fill="#5a341e" transform="rotate(12)" />
  </g>
);

type LightProps = Readonly<{ center: Point; radius: number; strength: number }>;

// The light of the fire on the air around it and, flatter, on the floor under it.
const FireLight: FC<LightProps> = ({ center, radius, strength }) => {
  const air = `radial-gradient(circle ${radius}px at ${center.x}px ${center.y - radius * 0.12}px, #ff9a3c, rgba(255,120,40,0.25) 45%, transparent)`;
  const floor = `radial-gradient(ellipse ${radius * 0.5}px ${radius * 0.13}px at ${center.x}px ${center.y}px, rgba(255,190,100,0.9), transparent)`;
  return (
    <>
      <AbsoluteFill style={{ background: air, opacity: strength, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: floor, opacity: strength, mixBlendMode: 'screen' }} />
    </>
  );
};

/** A crackling campfire with its moving light and rising embers; `intensity` scales its size (default 1). */
export const Fire: FC<EffectProps> = ({ effect, aspect, frame, unit }) => {
  const center = EffectCenter.of(effect, aspect);
  const size = unit * 0.85 * (effect.intensity ?? 1);
  const flicker = Flicker.for('fire').at(frame);
  const area = { x: center.x - 140 * size, y: center.y - 560 * size, width: 280 * size, height: 480 * size };
  const embers = Particles.for('embers', { seed: 'fire', count: 22 }).at(frame, Fps.DEFAULT, area);
  return (
    <>
      <FireLight center={center} radius={950 * size} strength={0.6 * flicker} />
      <FrameCanvas width={aspect.width()} height={aspect.height()}>
        <g transform={`translate(${center.x} ${center.y}) scale(${size})`}>
          <Hearth />
          <Flames frame={frame} />
        </g>
        <ParticleDots particles={embers} radius={5 * size} color={effect.color ?? '#ffb347'} />
      </FrameCanvas>
    </>
  );
};
