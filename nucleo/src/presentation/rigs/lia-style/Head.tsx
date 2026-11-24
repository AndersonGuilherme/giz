import type { FC } from 'react';
import type { CharacterState } from '../../../domain/character/CharacterState.ts';
import { LiaStyleGeometry, type LiaEyes } from '../../../domain/character/LiaStyleGeometry.ts';
import { useSvgId } from '../svg.ts';
import { Brows, Eyes, Glasses } from './Eyes.tsx';
import { Hair } from './Hair.tsx';
import { EARS, HEAD, NECK } from './measures.ts';
import { Mouth } from './Mouth.tsx';
import { PALETTE, warmShade } from './palette.ts';
import type { Look } from './parameters.ts';

type HeadProps = Readonly<{ state: CharacterState; look: Look; tilt: number }>;

// The ears move against the face turn (0.4 of it), which gives the 3/4 feel.
const Ears: FC<Readonly<{ look: Look; shift: number }>> = ({ look, shift }) => (
  <g>
    {[EARS.left, EARS.right].map((x) => (
      <g key={x}>
        <circle cx={x + shift} cy={EARS.y} r={27} fill={look.skin} />
        <circle cx={x + shift} cy={EARS.y} r={14} fill={warmShade(look.skin)} />
      </g>
    ))}
  </g>
);

const HairGradient: FC<Readonly<{ id: string; look: Look }>> = ({ id, look }) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stopColor={look.hairColor} />
    <stop offset="1" stopColor={look.hairColor2} />
  </linearGradient>
);

// Blush, eyes, glasses and mouth turn with the face; the hair goes over them and the brows over the hair.
const Face: FC<Readonly<{ state: CharacterState; look: Look; eyes: LiaEyes }>> = ({ state, look, eyes }) => (
  <g transform={`translate(${eyes.faceTurn} 0)`}>
    <ellipse cx={128} cy={238} rx={16} ry={9} fill={PALETTE.blush} opacity={0.45} />
    <ellipse cx={272} cy={238} rx={16} ry={9} fill={PALETTE.blush} opacity={0.45} />
    <Eyes eyes={eyes} look={look} />
    {look.glasses && <Glasses look={look} />}
    <Mouth state={state} look={look} />
  </g>
);

/** The head, tilted around the neck: ears, face (blush, eyes, glasses, mouth), hair over the face and the brows on top. */
export const Head: FC<HeadProps> = ({ state, look, tilt }) => {
  const gradient = useSvgId('hair');
  const fill = `url(#${gradient})`;
  const eyes = LiaStyleGeometry.eyes(state.expression(), state.gaze(), state.eyeClosure());
  return (
    <g transform={`rotate(${tilt} ${NECK.x} ${NECK.y})`}>
      <defs><HairGradient id={gradient} look={look} /></defs>
      <Hair hair={look.hair} layer="back" fill={fill} />
      <Ears look={look} shift={-eyes.faceTurn * 0.4} />
      <ellipse cx={HEAD.x} cy={HEAD.y} rx={HEAD.radiusX} ry={HEAD.radiusY} fill={look.skin} />
      <path fill={warmShade(look.skin)} d="M92,200 C100,260 140,292 200,296 C150,280 112,250 92,200 Z" />
      <Face state={state} look={look} eyes={eyes} />
      <Hair hair={look.hair} layer="front" fill={fill} />
      <g transform={`translate(${eyes.faceTurn} 0)`}><Brows face={LiaStyleGeometry.face(state.expression())} look={look} /></g>
    </g>
  );
};
