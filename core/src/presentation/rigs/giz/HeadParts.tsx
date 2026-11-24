import type { FC } from 'react';
import type { HeadLayer, HeadPart } from '../../../domain/character/HeadPart.ts';
import type { Silhouette } from '../../../domain/drawing/Silhouette.ts';
import { Chalked } from './Chalked.tsx';
import { HEAD, UNIT } from './measures.ts';
import type { Look } from './parameters.ts';

/** How one role is painted: its fill, its opacity and whether it gets the chalk line (default yes). */
export type Paint = Readonly<{ fill: string; opacity?: number; chalk?: boolean; width?: number }>;
export type Painter = (role: string) => Paint;

const SCALED = new WeakMap<Silhouette, Silhouette>();

/** A face-unit outline in drawing units (head center, head radius); the same instance every frame. */
export function inDrawing(outline: Silhouette): Silhouette {
  const known = SCALED.get(outline) ?? outline.scaled(UNIT, HEAD);
  SCALED.set(outline, known);
  return known;
}

type HeadPartsProps = Readonly<{ parts: readonly HeadPart[]; layer: HeadLayer; look: Look; paint: Painter; group: string }>;

/** The parts of one layer, painted by role, each with its chalk line (seeded by the group, role and order). */
export const HeadParts: FC<HeadPartsProps> = ({ parts, layer, look, paint, group }) => (
  <g>
    {parts.map((part, index) => ({ part, index })).filter(({ part }) => part.layer === layer).map(({ part, index }) => {
      const { fill, opacity, chalk = true, width } = paint(part.role);
      const outline = inDrawing(part.outline);
      return (
        <g key={index}>
          <path d={outline.path()} fill={fill} opacity={opacity} />
          {chalk && <Chalked look={look} outline={outline} part={`${group}-${part.role}-${index}`} width={width} />}
        </g>
      );
    })}
  </g>
);
