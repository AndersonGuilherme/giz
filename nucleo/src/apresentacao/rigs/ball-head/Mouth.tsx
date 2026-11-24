import type { FC } from 'react';
import type { EstadoDoPersonagem } from '../../../dominio/personagem/EstadoDoPersonagem.ts';
import { MouthGeometry, type SilentMouth, type SpeechShape } from '../../../dominio/personagem/MouthGeometry.ts';
import { HEAD, MOUTH } from './measures.ts';
import type { Look } from './parameters.ts';
import { contrast, useSvgId } from './svg.ts';

const INSIDE = '#4a1119';
const TONGUE = '#e2707d';
const TEETH = '#ffffff';
const LIPS = '#d0606f';

// Pixel box of the interior: teeth hang from `top`, the tongue rises from `bottom`, the tucked lip covers the lower part.
type Interior = Readonly<{ path: string; top: number; bottom: number; teeth: boolean; tongue: boolean; lipTuck: boolean }>;

const InteriorParts: FC<Interior> = ({ top, bottom, teeth, tongue, lipTuck }) => {
  const height = bottom - top;
  return (
    <g>
      {teeth && <rect x={HEAD.x - 60} y={top - 2} width={120} height={Math.min(14, height * (lipTuck ? 0.55 : 0.34)) + 2} fill={TEETH} />}
      {tongue && <ellipse cx={HEAD.x} cy={bottom + 2} rx={24} ry={Math.max(8, height * 0.35)} fill={TONGUE} />}
      {lipTuck && <rect x={HEAD.x - 60} y={top + height * 0.55} width={120} height={height} fill={LIPS} />}
    </g>
  );
};

// Dark interior with pink lips (teeth stay readable against them), clipped to the mouth outline.
const OpenMouth: FC<Interior> = (interior) => {
  const clip = useSvgId('mouth');
  return (
    <g>
      <clipPath id={clip}><path d={interior.path} /></clipPath>
      <path d={interior.path} fill={INSIDE} />
      <g clipPath={`url(#${clip})`}><InteriorParts {...interior} /></g>
      <path d={interior.path} fill="none" stroke={LIPS} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

const px = (units: number) => units * MOUTH.unit;

function closedPath({ width, tilt, wave, upper }: SilentMouth): string {
  const [x0, x1] = [HEAD.x - px(width / 2), HEAD.x + px(width / 2)];
  const [y0, y1] = [MOUTH.y + px(tilt / 2), MOUTH.y - px(tilt / 2)];
  if (wave > 0) return `M${x0},${y0} Q${(x0 + HEAD.x) / 2},${y0 - px(wave)} ${HEAD.x},${MOUTH.y} T${x1},${y1}`;
  return `M${x0},${y0} Q${HEAD.x},${MOUTH.y + px(upper)} ${x1},${y1}`;
}

function silentInterior(mouth: SilentMouth): Interior {
  const [x0, x1, y1] = [HEAD.x - px(mouth.width / 2), HEAD.x + px(mouth.width / 2), MOUTH.y - px(mouth.tilt / 2)];
  const [upper, lower] = [MOUTH.y + px(mouth.upper), MOUTH.y + px(mouth.lower)];
  const path = `M${x0},${MOUTH.y} C${x0 + 4},${upper} ${x1 - 4},${upper} ${x1},${y1} C${x1 - 2},${lower} ${x0 + 2},${lower} ${x0},${MOUTH.y} Z`;
  // A cubic with both controls at y reaches 3/4 of the way: the interior box follows the drawn edges.
  const [top, bottom] = [MOUTH.y + px(mouth.upper) * 0.75, MOUTH.y + px(mouth.lower) * 0.75];
  return { path, top, bottom, teeth: mouth.teeth, tongue: mouth.tongue, lipTuck: false };
}

const Silent: FC<Readonly<{ mouth: SilentMouth; line: string }>> = ({ mouth, line }) => {
  if (mouth.open) return <OpenMouth {...silentInterior(mouth)} />;
  return <path d={closedPath(mouth)} fill="none" stroke={line} strokeWidth={7} strokeLinecap="round" />;
};

function speechInterior({ width, height, teeth, tongue, outline, lipTuck }: SpeechShape): Interior {
  const [rx, ry] = [px(width / 2), px(height / 2)];
  const cy = MOUTH.y + ry * 0.3;
  const corner = outline === 'wide' ? Math.min(ry, 10) : ry;
  const [x0, x1, y0, y1] = [HEAD.x - rx, HEAD.x + rx, cy - ry, cy + ry];
  const path = `M${x0 + corner},${y0} H${x1 - corner} Q${x1},${y0} ${x1},${y0 + corner} V${y1 - corner} Q${x1},${y1} ${x1 - corner},${y1}`
    + ` H${x0 + corner} Q${x0},${y1} ${x0},${y1 - corner} V${y0 + corner} Q${x0},${y0} ${x0 + corner},${y0} Z`;
  return { path: outline === 'wide' ? path : ellipsePath(rx, ry, cy), top: y0, bottom: y1 - 2, teeth, tongue, lipTuck };
}

const ellipsePath = (rx: number, ry: number, cy: number) =>
  `M${HEAD.x - rx},${cy} A${rx},${ry} 0 1,0 ${HEAD.x + rx},${cy} A${rx},${ry} 0 1,0 ${HEAD.x - rx},${cy} Z`;

const Speaking: FC<Readonly<{ shape: SpeechShape; line: string }>> = ({ shape, line }) => {
  if (shape.height > 0) return <OpenMouth {...speechInterior(shape)} />;
  const half = px(shape.width / 2);
  return <path d={`M${HEAD.x - half},${MOUTH.y} L${HEAD.x + half},${MOUTH.y}`} stroke={line} strokeWidth={8} strokeLinecap="round" />;
};

/** Draws the mouth the domain picked for this state: the viseme while speaking, otherwise the expression's mouth. */
export const Mouth: FC<Readonly<{ state: EstadoDoPersonagem; look: Look }>> = ({ state, look }) => {
  const mouth = MouthGeometry.forState(state);
  const line = contrast(look.headColor);
  return mouth.speaking ? <Speaking shape={mouth.shape} line={line} /> : <Silent mouth={mouth.shape} line={line} />;
};
