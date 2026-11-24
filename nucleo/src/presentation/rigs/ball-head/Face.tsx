import type { FC } from 'react';
import type { CharacterState } from '../../../domain/character/CharacterState.ts';
import { FaceGeometry } from '../../../domain/character/FaceGeometry.ts';
import { Brows } from './Brows.tsx';
import { Eyes, Glasses } from './Eyes.tsx';
import { HEAD } from './measures.ts';
import { Mouth } from './Mouth.tsx';
import type { Look } from './parameters.ts';
import { shade, useSvgId } from './svg.ts';

/** The ball: flat color, a soft light from the upper left and, with `shine`, a glossy highlight. */
export const Ball: FC<Readonly<{ look: Look }>> = ({ look }) => {
  const light = useSvgId('light');
  return (
    <g>
      <radialGradient id={light} cx="0.36" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
        <stop offset="0.6" stopColor="#ffffff" stopOpacity={0} />
      </radialGradient>
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.radius} fill={look.headColor} />
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.radius} fill={`url(#${light})`} />
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.radius - 2} fill="none" stroke={shade(look.headColor, 0.12)} strokeWidth={3} />
      {look.shine && <ellipse cx={130} cy={84} rx={36} ry={15} transform="rotate(-38 130 84)" fill="#ffffff" opacity={0.3} />}
      {look.shine && <circle cx={100} cy={122} r={6} fill="#ffffff" opacity={0.35} />}
    </g>
  );
};

const Sweat: FC = () => (
  <path
    d="M0,-18 C6,-6 11,1 11,8 A11,11 0 0,1 -11,8 C-11,1 -6,-6 0,-18 Z"
    transform="translate(318 92) rotate(18)"
    fill="#a9dcff"
    stroke="#ffffff"
    strokeWidth={3}
  />
);

/** Eyes, brows and mouth from the domain geometry of the state's expression. */
export const Face: FC<Readonly<{ state: CharacterState; look: Look }>> = ({ state, look }) => {
  const face = FaceGeometry.for(state.expression());
  const eyes = FaceGeometry.eyes(state.expression(), state.gaze(), state.eyeClosure());
  return (
    <g>
      <Eyes eyes={eyes} look={look} />
      {look.glasses && <Glasses look={look} />}
      <Brows pair={face.brows} look={look} />
      <Mouth state={state} look={look} />
      {face.sweat && <Sweat />}
    </g>
  );
};
