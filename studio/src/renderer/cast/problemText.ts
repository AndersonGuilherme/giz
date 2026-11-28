import type { CharacterFile, CharacterProblem, ParameterInfo, ParameterValue, RigInfo } from '../../shared/cast.ts';
import type { MessageKey, Translate } from '../../shared/i18n/translate.ts';
import { labelOf } from '../labels.ts';
import { languageOf } from '../media/money.ts';

/** A problem as the editor says it: the field by its name on screen and what is wrong, in the interface language. */
export type ProblemLine = Readonly<{ field: string; text: string }>;
type Context = Readonly<{ file: CharacterFile; rig: RigInfo | undefined }>;

const PARAMETER = /^parameters\.(.+)$/;
// The fields of the identity and voice cards, by core's path.
const FIELDS: Readonly<Record<string, MessageKey>> = {
  name: 'cast.name', rig: 'cast.rig', personality: 'cast.personality', defaultExpression: 'cast.defaultExpression', voice: 'cast.voice', 'voice.id': 'cast.voiceId',
};
const BY_TYPE: Readonly<Record<ParameterInfo['type'], MessageKey>> = {
  option: 'cast.problem.option', color: 'cast.problem.color', number: 'cast.problem.number', boolean: 'cast.problem.boolean',
};

function parameterText(translate: Translate, name: string, context: Context & Readonly<{ rig: RigInfo }>): string {
  const info = context.rig.parameters[name];
  const rigName = context.rig.name[languageOf(translate)];
  if (!info) return translate('cast.problem.unknown', { rig: rigName });
  const value: ParameterValue | undefined = context.file.parameters[name];
  const shown = typeof value === 'string' ? labelOf(translate, `opt.${name}`, value) : String(value);
  return translate(BY_TYPE[info.type], { value: shown, rig: rigName, min: info.min ?? 0, max: info.max ?? 1 });
}

/** One of core's problems with the names the person sees (`parameters.skin` → "Pele"), not core's paths and ids. */
export function problemLine(translate: Translate, problem: CharacterProblem, context: Context): ProblemLine {
  const parameter = PARAMETER.exec(problem.path)?.[1];
  const rig = context.rig;
  if (parameter && rig) return { field: labelOf(translate, 'param', parameter), text: parameterText(translate, parameter, { ...context, rig }) };
  const key = FIELDS[problem.path];
  const field = key ? translate(key) : problem.path;
  if (problem.path === 'defaultExpression') return { field, text: translate('cast.problem.expression', { value: context.file.defaultExpression }) };
  return { field, text: problem.message };
}
