import type { FC, ReactNode } from 'react';
import type { MouthShape } from '../../../dominio/personagem/FaceGeometry.ts';
import { MouthGeometry, type SpeechShape } from '../../../dominio/personagem/MouthGeometry.ts';
import type { EstadoDoPersonagem } from '../../../dominio/personagem/EstadoDoPersonagem.ts';
import { HEAD, MOUTH } from './measures.ts';
import type { Look } from './parameters.ts';
import { contrast, useSvgId } from './svg.ts';

const INSIDE = '#4a1119';
const TONGUE = '#e2707d';
const TEETH = '#ffffff';
const LIPS = '#d0606f';

type Interior = Readonly<{ path: string; top: number; bottom: number; teeth: boolean; tongue: boolean }>;

// Dark interior with pink lips (teeth stay readable against them); teeth on top and tongue at the bottom, clipped to the mouth.
const OpenMouth: FC<Interior> = ({ path, top, bottom, teeth, tongue }) => {
  const clip = useSvgId('mouth');
  const height = bottom - top;
  return (
    <g>
      <clipPath id={clip}><path d={path} /></clipPath>
      <path d={path} fill={INSIDE} />
      <g clipPath={`url(#${clip})`}>
        {teeth && <rect x={HEAD.x - 60} y={top - 2} width={120} height={Math.min(14, height * 0.34) + 2} fill={TEETH} />}
        {tongue && <ellipse cx={HEAD.x} cy={bottom + 2} rx={24} ry={Math.max(8, height * 0.35)} fill={TONGUE} />}
      </g>
      <path d={path} fill="none" stroke={LIPS} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

function closedPath({ width, curve, tilt, wave }: MouthShape): string {
  const half = (width / 2) * MOUTH.unit;
  const [left, right] = [MOUTH.y + (tilt / 2) * MOUTH.unit, MOUTH.y - (tilt / 2) * MOUTH.unit];
  if (wave > 0) return `M${HEAD.x - half},${left} Q${HEAD.x - half / 2},${left - wave * MOUTH.unit * 1.6} ${HEAD.x},${MOUTH.y} T${HEAD.x + half},${right}`;
  return `M${HEAD.x - half},${left} Q${HEAD.x},${MOUTH.y + curve * MOUTH.unit * 1.6} ${HEAD.x + half},${right}`;
}

function openInterior(shape: MouthShape): Interior {
  const half = (shape.width / 2) * MOUTH.unit;
  const top = MOUTH.y + (shape.curve * (shape.curve > 0 ? 0.3 : 1.2) - shape.opening * 0.35) * MOUTH.unit;
  const bottom = MOUTH.y + (shape.curve * (shape.curve > 0 ? 1.2 : 0.3) + shape.opening * 1.4) * MOUTH.unit;
  const [x0, x1, y0] = [HEAD.x - half, HEAD.x + half, MOUTH.y - (shape.tilt / 2) * MOUTH.unit];
  const path = `M${x0},${MOUTH.y} C${x0 + 4},${top} ${x1 - 4},${top} ${x1},${y0} C${x1 - 2},${bottom} ${x0 + 2},${bottom} ${x0},${MOUTH.y} Z`;
  return { path, top: (MOUTH.y + top) / 2, bottom: (MOUTH.y + bottom) / 2 + 4, teeth: shape.width >= 24, tongue: shape.opening >= 14 };
}

const SilentMouth: FC<Readonly<{ shape: MouthShape; line: string }>> = ({ shape, line }) => {
  if (shape.opening > 0) return <OpenMouth {...openInterior(shape)} />;
  return <path d={closedPath(shape)} fill="none" stroke={line} strokeWidth={7} strokeLinecap="round" />;
};

function speechInterior({ width, height, teeth, tongue }: SpeechShape): Interior {
  const [rx, ry] = [(width / 2) * MOUTH.unit, (height / 2) * MOUTH.unit];
  const cy = MOUTH.y + ry * 0.3;
  const path = `M${HEAD.x - rx},${cy} A${rx},${ry} 0 1,0 ${HEAD.x + rx},${cy} A${rx},${ry} 0 1,0 ${HEAD.x - rx},${cy} Z`;
  return { path, top: cy - ry, bottom: cy + ry - 2, teeth, tongue: tongue && ry > 9 };
}

const SpeakingMouth: FC<Readonly<{ shape: SpeechShape; line: string }>> = ({ shape, line }) => {
  if (shape.height === 0) {
    const half = (shape.width / 2) * MOUTH.unit;
    return <path d={`M${HEAD.x - half},${MOUTH.y} L${HEAD.x + half},${MOUTH.y}`} stroke={line} strokeWidth={8} strokeLinecap="round" />;
  }
  return <OpenMouth {...speechInterior(shape)} />;
};

type MouthProps = Readonly<{ state: EstadoDoPersonagem; shape: MouthShape; look: Look }>;

/** Speaking and not at rest: the viseme shape; otherwise, the expression's mouth. */
export const Mouth: FC<MouthProps> = ({ state, shape, look }): ReactNode => {
  const line = contrast(look.headColor);
  if (!state.estaFalando() || state.visema() === 'X') return <SilentMouth shape={shape} line={line} />;
  return <SpeakingMouth shape={MouthGeometry.for(state.visema(), state.abertura())} line={line} />;
};
