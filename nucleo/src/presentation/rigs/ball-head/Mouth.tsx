import type { FC, ReactNode } from 'react';
import type { EstadoDoPersonagem } from '../../../dominio/personagem/EstadoDoPersonagem.ts';
import { MouthLayout, type MouthOutline, type MouthParts, type Oval, type Rect } from '../../../dominio/personagem/MouthLayout.ts';
import { HEAD, MOUTH } from './measures.ts';
import type { Look } from './parameters.ts';
import { contrast, useSvgId } from './svg.ts';

const INSIDE = '#4a1119';
const TONGUE = '#e2707d';
const TEETH = '#ffffff';
const LIPS = '#d0606f';

// Face units → pixels: x from the head center, y from the mouth line.
const px = (units: number) => units * MOUTH.unit;
const at = (x: number, y: number) => `${HEAD.x + px(x)},${MOUTH.y + px(y)}`;

type Outline<Kind extends MouthOutline['kind']> = Extract<MouthOutline, { kind: Kind }>;

const PATHS: Readonly<{ [Kind in MouthOutline['kind']]: (outline: Outline<Kind>) => string }> = {
  pressed: ({ width }) => `M${at(-width / 2, 0)} L${at(width / 2, 0)}`,
  line: ({ width, tilt, bend }) => `M${at(-width / 2, tilt / 2)} Q${at(0, bend)} ${at(width / 2, -tilt / 2)}`,
  wave: ({ width, tilt, wave }) => `M${at(-width / 2, tilt / 2)} Q${at(-width / 4, tilt / 2 - wave)} ${at(0, 0)} T${at(width / 2, -tilt / 2)}`,
  cubic: ({ width, tilt, upper, lower }) => {
    const [left, right] = [-width / 2, width / 2];
    return `M${at(left, 0)} C${at(left + 2, upper)} ${at(right - 2, upper)} ${at(right, -tilt / 2)}`
      + ` C${at(right - 1, lower)} ${at(left + 1, lower)} ${at(left, 0)} Z`;
  },
  oval: ({ width, height, center }) => {
    const [rx, ry] = [px(width / 2), px(height / 2)];
    return `M${at(-width / 2, center)} A${rx},${ry} 0 1,0 ${at(width / 2, center)} A${rx},${ry} 0 1,0 ${at(-width / 2, center)} Z`;
  },
  rounded: ({ width, height, center, corner }) => {
    const [x0, y0, x1, y1] = [-width / 2, center - height / 2, width / 2, center + height / 2];
    return `M${at(x0 + corner, y0)} L${at(x1 - corner, y0)} Q${at(x1, y0)} ${at(x1, y0 + corner)} L${at(x1, y1 - corner)}`
      + ` Q${at(x1, y1)} ${at(x1 - corner, y1)} L${at(x0 + corner, y1)} Q${at(x0, y1)} ${at(x0, y1 - corner)}`
      + ` L${at(x0, y0 + corner)} Q${at(x0, y0)} ${at(x0 + corner, y0)} Z`;
  },
};

const pathOf = (outline: MouthOutline) => (PATHS[outline.kind] as (outline: MouthOutline) => string)(outline);

const Band: FC<Readonly<{ rect: Rect; fill: string }>> = ({ rect, fill }) =>
  <rect x={HEAD.x + px(rect.x)} y={MOUTH.y + px(rect.y)} width={px(rect.width)} height={px(rect.height)} fill={fill} />;
const Tongue: FC<Readonly<{ oval: Oval }>> = ({ oval }) =>
  <ellipse cx={HEAD.x + px(oval.cx)} cy={MOUTH.y + px(oval.cy)} rx={px(oval.rx)} ry={px(oval.ry)} fill={TONGUE} />;

// Dark interior with pink lips (teeth stay readable against them); the parts are clipped to the outline.
const OpenMouth: FC<Readonly<{ parts: MouthParts }>> = ({ parts }) => {
  const clip = useSvgId('mouth');
  const path = pathOf(parts.outline);
  return (
    <g>
      <clipPath id={clip}><path d={path} /></clipPath>
      <path d={path} fill={INSIDE} />
      <g clipPath={`url(#${clip})`}>
        {parts.teeth && <Band rect={parts.teeth} fill={TEETH} />}
        {parts.tongue && <Tongue oval={parts.tongue} />}
        {parts.lip && <Band rect={parts.lip} fill={LIPS} />}
      </g>
      <path d={path} fill="none" stroke={LIPS} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};

const CLOSED: ReadonlySet<MouthOutline['kind']> = new Set(['pressed', 'line', 'wave']);

/** Draws the mouth the domain laid out for this state: a stroked line when closed, an open mouth otherwise. */
export const Mouth: FC<Readonly<{ state: EstadoDoPersonagem; look: Look }>> = ({ state, look }): ReactNode => {
  const parts = MouthLayout.for(state);
  if (!CLOSED.has(parts.outline.kind)) return <OpenMouth parts={parts} />;
  return <path d={pathOf(parts.outline)} fill="none" stroke={contrast(look.headColor)} strokeWidth={7} strokeLinecap="round" />;
};
