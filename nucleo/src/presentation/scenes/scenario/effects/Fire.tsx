import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { FireLayout } from '../../../../domain/scenario/FireLayout.ts';
import type { Tongue } from '../../../../domain/scenario/Flame.ts';
import type { Point } from '../../../../domain/script/SceneElements.ts';
import type { EffectProps } from './EffectModel.ts';
import { FrameCanvas, ParticleDots } from './ParticleDots.tsx';

// A campfire in fire units, burning on (0, 0). The domain gives the tongues of each ring; here they only get colors.
const RING_COLORS = ['#ff5a1a', '#ffa328', '#ffe58a'] as const;

// A teardrop standing on its base, pointed at the top; the tip moves sideways by `lean` widths.
function tonguePath({ x, width, height, lean }: Tongue): string {
  const tip = x + lean * width * 1.6;
  const sides = `C ${x - width} ${-height * 0.3} ${x - width * 0.55} ${-height * 0.62} ${tip} ${-height} C ${x + width * 0.55} ${-height * 0.62} ${x + width} ${-height * 0.3} ${x + width} 0`;
  return `M ${x - width} 0 ${sides} Q ${x} ${width * 0.7} ${x - width} 0 Z`;
}

const Flames: FC<Readonly<{ rings: readonly (readonly Tongue[])[] }>> = ({ rings }) => (
  <g>
    <ellipse cx={0} cy={-90} rx={110} ry={150} fill="#ff7a22" opacity={0.35} style={{ filter: 'blur(18px)' }} />
    <g style={{ filter: 'blur(1.2px)' }}>
      {rings.map((ring, index) => <path key={index} fill={RING_COLORS[index]} d={ring.map(tonguePath).join(' ')} />)}
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

type LightProps = Readonly<{ center: Point; radius: number; opacity: number }>;

// The light of the fire on the air around it and, flatter, on the floor under it.
const FireLight: FC<LightProps> = ({ center, radius, opacity }) => {
  const air = `radial-gradient(circle ${radius}px at ${center.x}px ${center.y - radius * 0.12}px, #ff9a3c, rgba(255,120,40,0.25) 45%, transparent)`;
  const floor = `radial-gradient(ellipse ${radius * 0.5}px ${radius * 0.13}px at ${center.x}px ${center.y}px, rgba(255,190,100,0.9), transparent)`;
  return (
    <>
      <AbsoluteFill style={{ background: air, opacity, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: floor, opacity, mixBlendMode: 'screen' }} />
    </>
  );
};

/** A crackling campfire with its moving light and rising embers; `intensity` scales its size. */
export const Fire: FC<EffectProps> = ({ effect, aspect, frame }) => {
  const { center, scale, flame, embers, light } = FireLayout.for(effect, aspect, frame);
  return (
    <>
      <FireLight center={center} radius={light.radius} opacity={light.opacity} />
      <FrameCanvas width={aspect.width()} height={aspect.height()}>
        <g transform={`translate(${center.x} ${center.y}) scale(${scale})`}>
          <Hearth />
          <Flames rings={flame} />
        </g>
        <ParticleDots particles={embers} radius={5 * scale} color={effect.color ?? '#ffb347'} />
      </FrameCanvas>
    </>
  );
};
