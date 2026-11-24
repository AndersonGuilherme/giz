import type { ParameterValue } from '../../domain/cast/Character.ts';
import type { StanceData } from '../../domain/scenario/Stance.ts';

export type ParameterType = 'color' | 'number' | 'option' | 'boolean';

export type ParameterDefinition = {
  type: ParameterType;
  defaultValue: string | number | boolean;
  min?: number;
  max?: number;
  options?: string[];
};

export type ParameterDefinitions = Record<string, ParameterDefinition>;

/** The available rigs, the parameters each one accepts and where a character of each rig draws. */
export interface RigCatalog {
  definition(rigId: string): ParameterDefinitions | undefined;
  ids(): string[];
  /** The rig's stance for a character with these (validated) parameters, with how high it reaches; `undefined` for an unknown rig. */
  stance(rigId: string, parameters: Readonly<Record<string, ParameterValue>>): StanceData | undefined;
}
