import type { FC } from 'react';
import { ArmGeometry } from '../../../dominio/personagem/ArmGeometry.ts';
import type { EstadoDoPersonagem } from '../../../dominio/personagem/EstadoDoPersonagem.ts';
import type { RigProps } from '../RigModel.ts';
import { Arm } from './Arms.tsx';
import { Ball, Face } from './Face.tsx';
import { Hair } from './Hair.tsx';
import { FEET, NECK, VIEW_BOX } from './measures.ts';
import { lookOf, type Look } from './parameters.ts';
import { Outfit } from './Outfit.tsx';

type BodyProps = Readonly<{ state: EstadoDoPersonagem; look: Look }>;

// Back to front: shadow, arms behind the head, legs and torso, head with hair and face, arms in front of the head.
const Body: FC<BodyProps> = ({ state, look }) => {
  const { left, right, headTilt } = ArmGeometry.for(state.pose());
  return (
    <g>
      <Outfit look={look} />
      {!left.inFront && <Arm arm={left} side={-1} look={look} />}
      {!right.inFront && <Arm arm={right} side={1} look={look} />}
      <g transform={`rotate(${headTilt} ${NECK.x} ${NECK.y})`}>
        <Hair look={look} layer="back" />
        <Ball look={look} />
        <Hair look={look} layer="front" />
        <Face state={state} look={look} />
      </g>
      {left.inFront && <Arm arm={left} side={-1} look={look} />}
      {right.inFront && <Arm arm={right} side={1} look={look} />}
    </g>
  );
};

/** The ball-head rig: a faceless-style dark ball head with big eyes, brows that carry the emotion and a clothed body. */
export const BallHead: FC<RigProps> = ({ state, parameters, height, side }) => {
  const { y, rotacao, escala } = state.deslocamentoDoCorpo();
  const look = lookOf(parameters);
  const width = (height * VIEW_BOX.width) / VIEW_BOX.height;
  const body = `translate(0 ${y}) translate(200 ${FEET.y}) rotate(${rotacao}) scale(${escala}) translate(-200 -${FEET.y})`;
  return (
    <svg viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`} width={width} height={height} style={{ overflow: 'visible' }}>
      <ellipse cx={200} cy={FEET.y} rx={92} ry={10} fill="#000000" opacity={0.16} />
      <g transform={side < 0 ? 'translate(400 0) scale(-1 1)' : undefined}>
        <g transform={body}>
          <Body state={state} look={look} />
        </g>
      </g>
    </svg>
  );
};
