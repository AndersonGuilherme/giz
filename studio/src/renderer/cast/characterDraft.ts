import type { CharacterFile, ParameterValue, RigInfo } from '../../shared/cast.ts';

/** Every parameter of the rig: the file's value, or the rig's default (what the drawing and the controls show). */
export function parametersOf(file: CharacterFile, rig: RigInfo | undefined): Record<string, ParameterValue> {
  const defaults = Object.entries(rig?.parameters ?? {}).map(([name, { defaultValue }]) => [name, defaultValue] as const);
  return { ...Object.fromEntries(defaults), ...file.parameters };
}

/** One parameter changed; back to the default, it leaves the file (the file keeps only what was chosen). */
export function withParameter(file: CharacterFile, rig: RigInfo | undefined, change: Readonly<{ name: string; value: ParameterValue }>): CharacterFile {
  const rest = Object.fromEntries(Object.entries(file.parameters).filter(([name]) => name !== change.name));
  const isDefault = rig?.parameters[change.name]?.defaultValue === change.value;
  return { ...file, parameters: isDefault ? rest : { ...rest, [change.name]: change.value } };
}

/** Another rig: the parameters it does not have are dropped (the others are kept). */
export function withRig(file: CharacterFile, rig: RigInfo): CharacterFile {
  const kept = Object.entries(file.parameters).filter(([name]) => rig.parameters[name] !== undefined);
  return { ...file, rig: rig.id, parameters: Object.fromEntries(kept) };
}

/** The options with a drawn preview (a small character with each option), in the order the editor shows them. */
export const PREVIEWED = ['species', 'skin', 'headShape', 'hair', 'facialHair', 'outfit', 'headwear', 'emblem'] as const;
export const isPreviewed = (name: string): boolean => (PREVIEWED as readonly string[]).includes(name);
