import type { FC } from 'react';
import type { ParameterDefinitions } from '../../application/ports/RigCatalog.ts';
import type { ParameterValue } from '../../domain/cast/Character.ts';
import type { CharacterState } from '../../domain/character/CharacterState.ts';
import type { StanceData } from '../../domain/scenario/Stance.ts';

/** Parameters already validated against the rig definition, with defaults applied. */
export type ValidatedParameters = Readonly<Record<string, ParameterValue>>;

/**
 * `height` in pixels of the whole character; `side` 1 turns the face to the right of the screen, -1 to the left;
 * `id` (the character's) keeps hand-drawn details, like the chalk line, different from one character to another.
 */
export type RigProps = Readonly<{ state: CharacterState; parameters: ValidatedParameters; height: number; side: -1 | 1; id?: string }>;

/** What Node (CLI, cast validation) needs to know about a rig, without React; `stance` puts its soles on the scene floor. */
export type RigDefinition = Readonly<{
  id: string;
  name: Readonly<{ 'pt-BR': string; en: string }>;
  parameters: ParameterDefinitions;
  stance: StanceData;
}>;

/** The full rig, with the component that draws it (only in the Remotion bundle). */
export interface RigModel extends RigDefinition {
  readonly Component: FC<RigProps>;
}
