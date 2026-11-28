import type { CharacterFile, ParameterInfo, ParameterValue, RigInfo } from '../../shared/cast.ts';

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

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
type Check = (value: ParameterValue, info: ParameterInfo) => boolean;
// As core's rig check: a color is #RGB or #RRGGBB (or its default word, `auto`); a number within its range.
const CHECKS: Readonly<Record<ParameterInfo['type'], Check>> = {
  color: (value, { defaultValue }) => value === defaultValue || (typeof value === 'string' && HEX_COLOR.test(value)),
  number: (value, { min = -Infinity, max = Infinity }) => typeof value === 'number' && value >= min && value <= max,
  option: (value, { options = [] }) => typeof value === 'string' && options.includes(value),
  boolean: (value) => typeof value === 'boolean',
};

/** Whether core's check accepts this value for the parameter (`info` absent: the rig has no such parameter). */
export const accepts = (info: ParameterInfo | undefined, value: ParameterValue): boolean => info !== undefined && CHECKS[info.type](value, info);

/**
 * Another rig: a parameter is kept only when the new rig has it and accepts its value (Lia's skin is a color, Gizzy's a
 * named tone: the same name, other values); the others go back to the new rig's default.
 */
export function withRig(file: CharacterFile, rig: RigInfo): CharacterFile {
  const kept = Object.entries(file.parameters).filter(([name, value]) => accepts(rig.parameters[name], value));
  return { ...file, rig: rig.id, parameters: Object.fromEntries(kept) };
}

/**
 * What the drawings get: every parameter of the rig, a value it cannot draw (a file written by hand) replaced by the
 * default; `wrong` names those values and the parameters the rig does not have, so the editor can say so.
 */
export function drawableParameters(file: CharacterFile, rig: RigInfo): Readonly<{ parameters: Record<string, ParameterValue>; wrong: readonly string[] }> {
  const wrong = Object.entries(file.parameters).filter(([name, value]) => !accepts(rig.parameters[name], value)).map(([name]) => name);
  const drawable = { ...file, parameters: Object.fromEntries(Object.entries(file.parameters).filter(([name]) => !wrong.includes(name))) };
  return { parameters: parametersOf(drawable, rig), wrong };
}

/** The options with a drawn preview (a small character with each option), in the order the editor shows them. */
export const PREVIEWED = ['species', 'skin', 'headShape', 'hair', 'facialHair', 'outfit', 'headwear', 'emblem'] as const;
export const isPreviewed = (name: string): boolean => (PREVIEWED as readonly string[]).includes(name);

/** The slider's step: whole numbers on a wide range, hundredths on a narrow one. */
export const numberStep = (info: ParameterInfo): number => ((info.max ?? 1) - (info.min ?? 0) > 5 ? 1 : 0.05);
