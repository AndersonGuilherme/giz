import type { FC } from 'react';
import { LiaStyleGeometry } from '../../../domain/character/LiaStyleGeometry.ts';
import type { RigProps } from '../RigModel.ts';
import { Arms } from './Arms.tsx';
import { Head } from './Head.tsx';
import { FEET, VIEW_BOX } from './measures.ts';
import { PALETTE } from './palette.ts';
import { lookOf } from './parameters.ts';
import { Outfit } from './Outfit.tsx';

/**
 * The lia-style rig, ported from the old motor's Lia and Téo: a big round head with dark sparkling eyes, glasses,
 * gradient hair and a hoodie. Back to front: shadow, legs and hoodie, arms behind the head, head, arms in front.
 */
export const LiaStyle: FC<RigProps> = ({ state, parameters, height, side }) => {
  const look = lookOf(parameters);
  const { y, rotation, scale } = state.bodyOffset();
  const pose = LiaStyleGeometry.pose(state.pose());
  const width = (height * VIEW_BOX.width) / VIEW_BOX.height;
  const body = `translate(0 ${y}) translate(${FEET.x} ${FEET.y}) rotate(${rotation + pose.lean}) scale(${scale}) translate(${-FEET.x} ${-FEET.y})`;
  return (
    <svg viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`} width={width} height={height} style={{ overflow: 'visible' }}>
      <ellipse cx={FEET.x} cy={585} rx={108} ry={10} fill={PALETTE.shadow} opacity={0.12} />
      <g transform={side < 0 ? 'translate(400 0) scale(-1 1)' : undefined}>
        <g transform={body}>
          <Outfit look={look} side={side} />
          <Arms pose={pose} look={look} inFront={false} />
          <Head state={state} look={look} tilt={pose.headTilt} />
          <Arms pose={pose} look={look} inFront />
        </g>
      </g>
    </svg>
  );
};
