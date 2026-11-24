import type { FC } from 'react';
import { shade } from '../svg.ts';
import type { PupilProps } from './Eyes.tsx';
import { EYES } from './measures.ts';
import { eyeScaleOf } from './parameters.ts';

/**
 * A robot's LED instead of the iris: a glowing rounded bar in the eye color with a bright core. It follows the gaze
 * like the iris, and the expression's pupil size makes it bigger or smaller.
 */
export const Led: FC<PupilProps> = ({ eye, pupil, look }) => {
  const scale = eyeScaleOf(look);
  const x = eye.cx + pupil.x * EYES.travel.x * scale;
  const y = eye.cy + 2 + pupil.y * EYES.travel.y * scale;
  const [width, height] = [EYES.iris * 1.3 * scale * pupil.scale, EYES.iris * 1.8 * scale * pupil.scale];
  return (
    <g>
      <ellipse cx={x} cy={y} rx={width * 1.1} ry={height * 0.95} fill={look.eyeColor} opacity={0.28} />
      <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={width / 2} fill={look.eyeColor} />
      <rect x={x - width / 5} y={y - height / 3} width={width / 2.5} height={height / 2.2} rx={width / 5} fill={shade(look.eyeColor, 0.6)} />
    </g>
  );
};
