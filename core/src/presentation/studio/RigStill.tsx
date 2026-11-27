import type { FC } from 'react';
import type { Expression, Pose } from '../../domain/cast/PoseAndExpression.ts';
import type { ValidatedParameters } from '../rigs/RigModel.ts';
import { rigModels } from '../rigs/rigModels.ts';
import { stillState } from '../remotion/sheetParts.tsx';

type Props = Readonly<{ id: string; rig: string; parameters: ValidatedParameters; height: number; pose?: Pose; expression?: Expression }>;

/** A still drawing of a character (no Remotion player): the Studio's option previews and cast list show these. */
export const RigStill: FC<Props> = ({ id, rig, parameters, height, pose, expression }) => {
  const model = rigModels.get(rig);
  return <model.Component state={stillState({ pose, expression })} parameters={parameters} height={height} side={1} id={id} />;
};
