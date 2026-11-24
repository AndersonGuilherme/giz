export type ParameterType = 'color' | 'number' | 'option' | 'boolean';

export type ParameterDefinition = {
  type: ParameterType;
  defaultValue: string | number | boolean;
  min?: number;
  max?: number;
  options?: string[];
};

export type ParameterDefinitions = Record<string, ParameterDefinition>;

/** The available rigs and the parameters each one accepts. */
export interface RigCatalog {
  definition(rigId: string): ParameterDefinitions | undefined;
  ids(): string[];
}
