import type { FC } from 'react';
import { Silhouette } from '../../../../domain/drawing/Silhouette.ts';
import { shade } from '../../svg.ts';
import { Chalked } from '../Chalked.tsx';
import { skinOf } from '../parameters.ts';
import type { OverlayProps, SpeciesOverlay } from './SpeciesOverlay.ts';

const CAPE = '#33264a';
const LINING = '#c23b52';
// The cape falls from the shoulders behind the body and flares out; its red lining shows inside.
const OUTER = 'M132,300 C94,380 58,480 42,582 Q200,606 358,582 C342,480 306,380 268,300 Z';
const INNER = 'M144,308 C112,392 84,484 72,572 Q200,592 328,572 C316,484 288,392 256,308 Z';
// The standing collar: a wing on each side of the neck, its tip out by the jaw (in front of the hair, behind the head).
const COLLAR = ['M184,300 L66,226 L84,298 L142,322 Z', 'M216,300 L334,226 L316,298 L258,322 Z'];

const Piece: FC<OverlayProps & Readonly<{ path: string; fill: string; part: string; side?: -1 | 1 }>> = ({ look, path, fill, part, side }) => (
  <g>
    <path d={path} fill={fill} />
    <Chalked look={look} outline={Silhouette.parse(path)} part={part} side={side} width={4.5} />
  </g>
);

const Cape: FC<OverlayProps> = ({ look }) => (
  <g>
    <Piece look={look} path={OUTER} fill={CAPE} part="cape" />
    <path d={INNER} fill={LINING} />
    <path d={INNER} fill="none" stroke={shade(LINING, -0.3)} strokeWidth={4} />
  </g>
);

const Collar: FC<OverlayProps> = ({ look }) => (
  <g>
    <Piece look={look} path={COLLAR[0]!} fill={LINING} part="collar" side={-1} />
    <Piece look={look} path={COLLAR[1]!} fill={LINING} part="collar" side={1} />
  </g>
);

/** The vampire: pointed ears in the skin color, a dark cape with a red lining and a standing collar. */
export const vampire: SpeciesOverlay = {
  paints: (look) => ({ ear: { fill: skinOf(look).base } }),
  Behind: Cape,
  Body: Collar,
};
