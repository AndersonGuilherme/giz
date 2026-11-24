import type { FC } from 'react';
import type { CharacterState } from '../../../domain/character/CharacterState.ts';
import { FaceGeometry } from '../../../domain/character/FaceGeometry.ts';
import { Species } from '../../../domain/character/species/Species.ts';
import { Brows } from './Brows.tsx';
import { Eyes, Glasses } from './Eyes.tsx';
import { CHEEKS, FRECKLES, HEAD, NOSE } from './measures.ts';
import { Mouth } from './Mouth.tsx';
import { skinOf, type Look } from './parameters.ts';

const Sweat: FC = () => (
  <path
    d="M0,-18 C6,-6 11,1 11,8 A11,11 0 0,1 -11,8 C-11,1 -6,-6 0,-18 Z"
    transform="translate(318 92) rotate(18)"
    fill="#a9dcff"
    stroke="#ffffff"
    strokeWidth={3}
  />
);

const SIDES = [-1, 1] as const;

/** A small nose dot, the optional cheeks and freckles. */
const Details: FC<Readonly<{ look: Look }>> = ({ look }) => {
  const skin = skinOf(look);
  return (
    <g>
      {look.cheeks && SIDES.map((side) => (
        <ellipse key={side} cx={HEAD.x + side * CHEEKS.x} cy={CHEEKS.y} rx={CHEEKS.radiusX} ry={CHEEKS.radiusY} fill={skin.blush} opacity={0.6} />
      ))}
      {look.freckles && SIDES.flatMap((side) => FRECKLES.map(([x, y]) => (
        <circle key={`${side}${x}${y}`} cx={HEAD.x + side * (CHEEKS.x + x)} cy={CHEEKS.y + y} r={2.6} fill={skin.line} opacity={0.45} />
      )))}
      <ellipse cx={HEAD.x} cy={NOSE.y} rx={NOSE.radiusX} ry={NOSE.radiusY} fill={skin.line} opacity={0.55} />
    </g>
  );
};

/** Eyes, brows and mouth from the domain geometry of the state's expression, plus the nose and cheeks. */
export const Face: FC<Readonly<{ state: CharacterState; look: Look }>> = ({ state, look }) => {
  const face = FaceGeometry.for(state.expression());
  const eyes = Species.eyes(look.species, FaceGeometry.eyes(state.expression(), state.gaze(), state.eyeClosure()));
  return (
    <g>
      <Details look={look} />
      <Eyes eyes={eyes} look={look} />
      {look.glasses && <Glasses look={look} />}
      <Brows pair={face.brows} look={look} />
      <Mouth state={state} look={look} />
      {face.sweat && <Sweat />}
    </g>
  );
};
