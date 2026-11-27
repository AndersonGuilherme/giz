import type { FC } from 'react';
import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';
import { rigModels } from '../rigs/rigModels.ts';
import { stillState } from '../remotion/sheetParts.tsx';
import { portraitFrame } from './portraitFrame.ts';

/** `framing` `head`: a square `height` wide, from above the top reach (a tall hat stays whole) down to the shoulders. */
type Props = Readonly<{ id: string; rig: string; parameters: ValidatedParameters; height: number; pose?: Pose; expression?: Expression; framing?: 'whole' | 'head' }>;

const Portrait: FC<Props> = ({ id, rig, parameters, height, pose, expression }) => {
  const model = rigModels.get(rig);
  const { viewBox } = model.stance;
  const frame = portraitFrame({ ...model.stance, top: model.reach?.(parameters) });
  return (
    <svg viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`} width={height} height={height}>
      <g transform={`translate(${viewBox.x} ${viewBox.y})`}>
        <model.Component state={stillState({ pose, expression })} parameters={parameters} height={viewBox.height} side={1} id={id} />
      </g>
    </svg>
  );
};

/** A still drawing of a character (no Remotion player): the Studio's option previews and cast list show these. */
export const RigStill: FC<Props> = (props) => {
  if (props.framing === 'head') return <Portrait {...props} />;
  const { id, rig, parameters, height, pose, expression } = props;
  const model = rigModels.get(rig);
  return <model.Component state={stillState({ pose, expression })} parameters={parameters} height={height} side={1} id={id} />;
};
