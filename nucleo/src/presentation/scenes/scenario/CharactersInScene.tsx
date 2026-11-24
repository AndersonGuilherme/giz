import type { FC } from 'react';
import type { CharacterState } from '../../../domain/character/CharacterState.ts';
import type { Spot } from '../../../domain/scenario/Placement.ts';
import { Stance } from '../../../domain/scenario/Stance.ts';
import { rigModels } from '../../rigs/rigModels.ts';
import type { CastMember } from '../SceneRegistry.ts';

// A faint warm halo ties the flat rig colors to the lit scene around them.
const AMBIENT_LIGHT = 'drop-shadow(0 0 14px rgba(255, 150, 70, 0.28))';

type CharactersProps = Readonly<{ spots: readonly Spot[]; cast: readonly CastMember[]; stateOf: (characterId: string) => CharacterState }>;

const OnSpot: FC<Readonly<{ spot: Spot; member: CastMember; state: CharacterState }>> = ({ spot, member, state }) => {
  const model = rigModels.get(member.rig ?? '');
  const rectangle = Stance.of(model.stance).rectangleFor(spot);
  return (
    <div style={{ position: 'absolute', left: rectangle.x, top: rectangle.y, filter: AMBIENT_LIGHT }}>
      <model.Component state={state} parameters={member.parameters} height={spot.height} side={spot.side} id={member.id} />
    </div>
  );
};

/** The characters on their spots, from back to front, with the soles of each rig on the ground line. */
export const CharactersInScene: FC<CharactersProps> = ({ spots, cast, stateOf }) => (
  <>
    {spots.map((spot) => {
      const member = cast.find(({ id }) => id === spot.character);
      if (!member?.rig) return null;
      return <OnSpot key={spot.character} spot={spot} member={member} state={stateOf(spot.character)} />;
    })}
  </>
);
