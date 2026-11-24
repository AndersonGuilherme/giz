import type { FC, ReactNode } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ArmGeometry } from '../../../domain/character/ArmGeometry.ts';
import type { CharacterState } from '../../../domain/character/CharacterState.ts';
import { Species } from '../../../domain/character/species/Species.ts';
import type { RigProps } from '../RigModel.ts';
import { Arm } from './Arms.tsx';
import { Face } from './Face.tsx';
import { Head } from './Head.tsx';
import { FacialHair, Hair } from './Hair.tsx';
import { Headwear } from './headwear/Headwear.tsx';
import { FEET, NECK, VIEW_BOX } from './measures.ts';
import { lookOf, type Look } from './parameters.ts';
import { Outfit } from './Outfit.tsx';
import { SpeciesBehind, SpeciesBody, SpeciesHead } from './species/SpeciesParts.tsx';

type BodyProps = Readonly<{ state: CharacterState; look: Look }>;

const Tilted: FC<Readonly<{ tilt: number; children: ReactNode }>> = ({ tilt, children }) => (
  <g transform={`rotate(${tilt} ${NECK.x} ${NECK.y})`}>{children}</g>
);

// The head with the species' features, its beard, hair and headwear, the face, then see-through headwear over the face.
const HeadAndFace: FC<BodyProps> = ({ state, look }) => (
  <g>
    <Head look={look} />
    <SpeciesHead look={look} layer="front" />
    <FacialHair look={look} />
    <Hair look={look} layer="front" />
    <Headwear look={look} layer="front" />
    <Face state={state} look={look} />
    <Headwear look={look} layer="over" />
  </g>
);

// Back to front: a cape, hair, headwear and species features behind the head (behind the body too: long hair falls
// down the back), legs and torso with the species' body over them, arms behind the head, the head, arms in front of it.
const Body: FC<BodyProps> = ({ state, look }) => {
  const { left, right, headTilt } = ArmGeometry.for(state.pose());
  return (
    <g>
      <SpeciesBehind look={look} />
      <Tilted tilt={headTilt}>
        <Hair look={look} layer="back" />
        <Headwear look={look} layer="back" />
        <SpeciesHead look={look} layer="back" />
      </Tilted>
      <Outfit look={look} />
      <SpeciesBody look={look} />
      {!left.inFront && <Arm arm={left} side={-1} look={look} />}
      {!right.inFront && <Arm arm={right} side={1} look={look} />}
      <Tilted tilt={headTilt}><HeadAndFace state={state} look={look} /></Tilted>
      {left.inFront && <Arm arm={left} side={-1} look={look} />}
      {right.inFront && <Arm arm={right} side={1} look={look} />}
    </g>
  );
};

/**
 * The giz rig, the house style: colored head, chalk outline, big expressive eyes and a clothed body. The `species`
 * turns it into a creature on the same body; a floating one is lifted off the ground and its shadow shrinks.
 */
export const Giz: FC<RigProps> = ({ state, parameters, height, side, id }) => {
  const look = lookOf(parameters, id);
  const lift = Species.lift(look.species, useCurrentFrame() / useVideoConfig().fps);
  const { y, rotation, scale } = state.bodyOffset();
  const width = (height * VIEW_BOX.width) / VIEW_BOX.height;
  const body = `translate(0 ${y + lift.y}) translate(200 ${FEET.y}) rotate(${rotation}) scale(${scale}) translate(-200 -${FEET.y})`;
  return (
    <svg viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`} width={width} height={height} style={{ overflow: 'visible' }}>
      <ellipse cx={200} cy={FEET.y} rx={92 * lift.shadow} ry={10 * lift.shadow} fill="#000000" opacity={0.16} />
      <g transform={side < 0 ? 'translate(400 0) scale(-1 1)' : undefined}>
        <g transform={body} opacity={Species.opacity(look.species)}>
          <Body state={state} look={look} />
        </g>
      </g>
    </svg>
  );
};
