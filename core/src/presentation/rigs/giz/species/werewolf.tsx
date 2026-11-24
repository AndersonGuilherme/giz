import type { FC } from 'react';
import type { Hand } from '../../../../domain/character/ArmGeometry.ts';
import { shade } from '../../svg.ts';
import { ARM } from '../measures.ts';
import { skinOf } from '../parameters.ts';
import type { HandOverlayProps, OverlayProps, SpeciesOverlay } from './SpeciesOverlay.ts';

const CLAW = '#fbf3e4';
// Where the claws sit on each hand shape (x across the hand, y the fingertips), in hand units.
const CLAW_TIPS: Readonly<Record<Hand, readonly (readonly [number, number])[]>> = {
  open: [[-10, ARM.fore + 30], [0, ARM.fore + 33], [10, ARM.fore + 30]],
  fist: [[-9, ARM.fore + 24], [1, ARM.fore + 26], [11, ARM.fore + 23]],
  index: [[0, ARM.fore + 44]],
};

const Claws: FC<HandOverlayProps> = ({ look, shape }) => (
  <g fill={CLAW} stroke={skinOf(look).line} strokeWidth={1.5} strokeLinejoin="round">
    {CLAW_TIPS[shape].map(([x, y]) => <path key={`${x}`} d={`M${x - 4},${y - 3} L${x + 4},${y - 3} L${x},${y + 8} Z`} />)}
  </g>
);

// A light tuft of chest fur at the neckline.
const CHEST = 'M170,294 L178,322 L186,306 L194,332 L202,306 L210,330 L218,306 L224,320 L230,294 Z';
const ChestFur: FC<OverlayProps> = ({ look }) => <path d={CHEST} fill={shade(skinOf(look).base, 0.3)} />;

/** The werewolf: darker fur ears and tufts, a pale muzzle, a dark nose, a chest tuft and claws. */
export const werewolf: SpeciesOverlay = {
  paints: (look) => {
    const skin = skinOf(look);
    return {
      fur: { fill: shade(skin.base, -0.14) },
      inner: { fill: '#e7a7a2', width: 3.5 },
      muzzle: { fill: shade(skin.base, 0.42), width: 4 },
      nose: { fill: '#3b2a22', width: 3 },
    };
  },
  Body: ChestFur,
  Hand: Claws,
};
