import type { FC } from 'react';
import { HeadShape } from '../../../domain/character/HeadShape.ts';
import { Chalked } from './Chalked.tsx';
import { HEAD, UNIT } from './measures.ts';
import { skinOf, type Look } from './parameters.ts';
import { useSvgId } from '../svg.ts';

/** The head outline of the look's shape, in drawing units. */
export const headOutline = (look: Look) => HeadShape.outline(look.headShape).scaled(UNIT, HEAD);

/** The head: flat skin, the side away from the light a little darker, and the chalk outline. */
export const Head: FC<Readonly<{ look: Look }>> = ({ look }) => {
  const clip = useSvgId('head');
  const outline = headOutline(look);
  const skin = skinOf(look);
  return (
    <g>
      <clipPath id={clip}><path d={outline.path()} /></clipPath>
      <path d={outline.path()} fill={skin.base} />
      <ellipse cx={HEAD.x - 34} cy={HEAD.y - 40} rx={HEAD.radius * 1.1} ry={HEAD.radius * 1.12} fill="none" stroke={skin.shade} strokeWidth={56} clipPath={`url(#${clip})`} opacity={0.75} />
      <Chalked look={look} outline={outline} seed="head" />
    </g>
  );
};
