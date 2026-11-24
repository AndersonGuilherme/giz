import type { FC } from 'react';
import type { CharacterState } from '../../../domain/character/CharacterState.ts';
import { LessonPresenters } from '../../../domain/lesson/LessonPresenters.ts';
import type { Spot } from '../../../domain/scenario/Placement.ts';
import { Stance } from '../../../domain/scenario/Stance.ts';
import type { AspectRatio } from '../../../domain/values/AspectRatio.ts';
import { rigModels } from '../../rigs/rigModels.ts';
import type { CastMember } from '../SceneRegistry.ts';

type PresentersProps = Readonly<{ cast: readonly CastMember[]; aspect: AspectRatio; onStage: boolean; stateOf: (characterId: string) => CharacterState }>;

const OnSpot: FC<Readonly<{ spot: Spot; member: CastMember; state: CharacterState }>> = ({ spot, member, state }) => {
  const model = rigModels.get(member.rig ?? '');
  const rectangle = Stance.of(model.stance).rectangleFor(spot);
  return (
    <div style={{ position: 'absolute', left: rectangle.x, top: rectangle.y }}>
      <model.Component state={state} parameters={member.parameters} height={spot.height} side={spot.side} />
    </div>
  );
};

/** The cast members with a body (the narrator has none), beside the content or, in `talk`, on the stage. */
export const PresentersView: FC<PresentersProps> = ({ cast, aspect, onStage, stateOf }) => {
  const presenters = cast.filter((member) => member.rig);
  const ids = presenters.map((member) => member.id);
  const spots = onStage ? LessonPresenters.onStage(ids, aspect) : LessonPresenters.beside(ids, aspect);
  return (
    <>
      {spots.map((spot, index) => <OnSpot key={spot.character} spot={spot} member={presenters[index]!} state={stateOf(spot.character)} />)}
    </>
  );
};
