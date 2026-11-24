import type { RigCatalog, ParameterDefinition, ParameterDefinitions } from '../../application/ports/RigCatalog.ts';
import type { ParameterValue } from '../../domain/cast/Character.ts';
import { HexColor } from '../../domain/values/HexColor.ts';
import { CharacterId } from '../../domain/values/CharacterId.ts';
import type { CharacterJson } from './characterSchema.ts';
import type { ProblemCollector } from './errorMessages.ts';
import { domainMessage } from './refinements.ts';

type Parameters = Record<string, ParameterValue>;
type Validator = (value: ParameterValue, definition: ParameterDefinition) => string | undefined;
type Source = Readonly<{ file: string; collector: ProblemCollector }>;

// A color whose default is a word (`auto`: the rig picks it) also accepts that word.
const color: Validator = (value, { defaultValue }) => {
  if (value === defaultValue) return undefined;
  return typeof value === 'string' ? domainMessage(() => HexColor.of(value)) : `esperava uma cor em texto, veio ${value}`;
};

const number: Validator = (value, { min = -Infinity, max = Infinity }) => {
  if (typeof value !== 'number') return `esperava um número, veio ${JSON.stringify(value)}`;
  return value >= min && value <= max ? undefined : `número ${value} fora de ${min} a ${max}`;
};

const option: Validator = (value, { options = [] }) =>
  options.includes(String(value)) ? undefined : `opção ${JSON.stringify(value)} inválida (use ${options.join(', ')})`;

const boolean: Validator = (value) =>
  typeof value === 'boolean' ? undefined : `esperava verdadeiro ou falso, veio ${JSON.stringify(value)}`;

const VALIDATORS = { color, number, option, boolean } as const;

function validateKnown(definitions: ParameterDefinitions, parameters: Parameters, source: Source): void {
  Object.entries(parameters).forEach(([name, value]) => {
    const definition = definitions[name];
    const message = definition && VALIDATORS[definition.type](value, definition);
    if (message) source.collector.add({ file: source.file, path: `parameters.${name}`, message });
  });
}

function rejectUnknown(json: Readonly<{ rig: string; parameters: Parameters }>, definitions: ParameterDefinitions, source: Source): void {
  const valid = Object.keys(definitions);
  Object.keys(json.parameters)
    .filter((name) => !valid.includes(name))
    .forEach((name) => source.collector.add({
      file: source.file,
      path: `parameters.${name}`,
      message: `parâmetro desconhecido no rig "${json.rig}" (use ${valid.join(', ')})`,
    }));
}

function withDefaults(definitions: ParameterDefinitions, parameters: Parameters): Parameters {
  const defaults = Object.entries(definitions).map(([name, definition]) => [name, definition.defaultValue]);
  return { ...Object.fromEntries(defaults), ...parameters };
}

/** Without a rig, only the narrator (a voice without a body, without parameters); every other character needs one. */
export function requiredRigPresent(json: CharacterJson, source: Source): boolean {
  if (json.rig !== undefined) return true;
  if (!CharacterId.of(json.id).isNarrator()) return reject(source, 'rig', 'obrigatório (só o narrador pode não ter rig)');
  if (Object.keys(json.parameters).length > 0) return reject(source, 'parameters', 'o narrador sem rig não tem parâmetros');
  return true;
}

function reject(source: Source, path: string, message: string): false {
  source.collector.add({ file: source.file, path, message });
  return false;
}

/** Validates the parameters against the rig definition and fills in the missing ones with the default. */
export function rigParameters(json: CharacterJson, catalog: RigCatalog, source: Source): Parameters {
  const { rig, parameters } = json;
  if (rig === undefined) return {};
  const definitions = catalog.definition(rig);
  if (!definitions) {
    const message = `rig "${rig}" desconhecido (use ${catalog.ids().join(', ')})`;
    source.collector.add({ file: source.file, path: 'rig', message });
    return parameters;
  }
  rejectUnknown({ rig, parameters }, definitions, source);
  validateKnown(definitions, parameters, source);
  return withDefaults(definitions, parameters);
}
