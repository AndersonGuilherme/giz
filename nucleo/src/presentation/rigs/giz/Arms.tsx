import type { FC } from 'react';
import type { Arm as ArmShape, Hand as HandShape } from '../../../domain/character/ArmGeometry.ts';
import { Silhouette } from '../../../domain/drawing/Silhouette.ts';
import { Chalked } from './Chalked.tsx';
import { ARM, SHOULDERS } from './measures.ts';
import { outfitPaletteOf, skinOf, sleeveOf, type Look } from './parameters.ts';
import { shade } from '../svg.ts';
import { SPECIES_OVERLAYS } from './species/speciesOverlays.ts';

type ArmProps = Readonly<{ arm: ArmShape; side: -1 | 1; look: Look }>;
type HandProps = Readonly<{ look: Look; side: -1 | 1 }>;

// Mitten hands in the skin color, drawn along +y (the forearm direction); the palm carries the chalk line.
const PALM = Silhouette.ellipse({ x: 0, y: ARM.fore + 10 }, 19, 23);
const FIST = Silhouette.ellipse({ x: 0, y: ARM.fore + 6 }, 20, 20);
const KNUCKLES = Silhouette.ellipse({ x: 0, y: ARM.fore + 6 }, 19, 19);
const FINGER = Silhouette.roundedRect({ x: -6, y: ARM.fore + 8, width: 12, height: 36 }, 6);

const HAND_SHAPES: Readonly<Record<HandShape, FC<HandProps>>> = {
  open: ({ look, side }) => (
    <g fill={skinOf(look).base}>
      <ellipse cx={side * 15} cy={ARM.fore + 2} rx={8} ry={12} transform={`rotate(${side * -30} ${side * 15} ${ARM.fore + 2})`} />
      <path d={PALM.path()} />
      <Chalked look={look} outline={PALM} part="palm" side={side} width={4.5} />
    </g>
  ),
  fist: ({ look, side }) => (
    <g fill={skinOf(look).base}>
      <path d={FIST.path()} />
      <Chalked look={look} outline={FIST} part="fist" side={side} width={4.5} />
    </g>
  ),
  index: ({ look, side }) => (
    <g fill={skinOf(look).base}>
      <path d={FINGER.path()} />
      <Chalked look={look} outline={FINGER} part="finger" side={side} width={4} />
      <path d={KNUCKLES.path()} />
      <Chalked look={look} outline={KNUCKLES} part="knuckles" side={side} width={4.5} />
    </g>
  ),
};

// The hand shape, then what the species adds on the hand (claws, wraps).
const Hand: FC<HandProps & Readonly<{ shape: HandShape }>> = ({ shape, side, look }) => {
  const [Shape, Extra] = [HAND_SHAPES[shape], SPECIES_OVERLAYS[look.species].Hand];
  return (
    <g transform={`translate(0 ${ARM.fore}) scale(1.3) translate(0 ${-ARM.fore})`}>
      <Shape look={look} side={side} />
      {Extra && <Extra look={look} side={side} shape={shape} />}
      <path d={`M-10,${ARM.fore + 2} q-2,9 3,16`} fill="none" stroke={skinOf(look).shade} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/** A rounded limb piece with its chalk line. */
const Limb: FC<Readonly<{ look: Look; rectangle: Parameters<typeof Silhouette.roundedRect>[0]; corner: number; color: string; part: string; side: -1 | 1 }>> = (props) => (
  <g>
    <rect {...props.rectangle} rx={props.corner} fill={props.color} />
    <Chalked look={props.look} outline={Silhouette.roundedRect(props.rectangle, props.corner)} part={props.part} side={props.side} />
  </g>
);

const Forearm: FC<ArmProps> = ({ arm, side, look }) => {
  const short = sleeveOf(look) !== 'long';
  const color = short ? skinOf(look).base : outfitPaletteOf(look).sleeve;
  return (
    <g transform={`translate(0 ${ARM.upper * arm.foreshortening}) rotate(${-side * arm.elbow})`}>
      <Limb look={look} rectangle={{ x: -ARM.thickness / 2 + 1, y: -12, width: ARM.thickness - 2, height: ARM.fore + 6 }} corner={15} color={color} part="fore" side={side} />
      {!short && <rect x={-ARM.thickness / 2} y={ARM.fore - 14} width={ARM.thickness} height={10} rx={5} fill={shade(color, -0.25)} />}
      <g transform={`rotate(${-side * arm.wrist} 0 ${ARM.fore})`}>
        <Hand shape={arm.hand} side={side} look={look} />
      </g>
    </g>
  );
};

// How far the sleeve reaches down the upper arm (`length`); a long sleeve covers the forearm too.
const SLEEVE_LENGTHS = { bare: () => 0, short: (length: number) => Math.min(length, 46), long: (length: number) => length + 12 } as const;

/** Upper arm (shoulder → elbow) and forearm, each with its own pivot; short sleeves and bare arms show the skin. */
export const Arm: FC<ArmProps> = (props) => {
  const { arm, side, look } = props;
  const shoulder = side < 0 ? SHOULDERS.left : SHOULDERS.right;
  const length = ARM.upper * arm.foreshortening;
  const sleeve = SLEEVE_LENGTHS[sleeveOf(look)](length);
  return (
    <g transform={`translate(${shoulder.x} ${shoulder.y}) rotate(${-side * arm.shoulder})`}>
      <Limb look={look} rectangle={{ x: -ARM.thickness / 2, y: -14, width: ARM.thickness, height: length + 26 }} corner={16} color={skinOf(look).base} part="upper" side={side} />
      {sleeve > 0 && <Limb look={look} rectangle={{ x: -ARM.thickness / 2 - 2, y: -16, width: ARM.thickness + 4, height: sleeve + 16 }} corner={17} color={outfitPaletteOf(look).sleeve} part="sleeve" side={side} />}
      <Forearm {...props} />
    </g>
  );
};
