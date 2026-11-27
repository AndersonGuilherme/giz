import type { ParameterDefinition, ParameterType, RigCatalog } from '../../ports/RigCatalog.ts';

// How each parameter type reads in the prompt.
const VALUES: Readonly<Record<ParameterType, (definition: ParameterDefinition) => string>> = {
  option: (definition) => (definition.options ?? []).join(' | '),
  color: (definition) => (definition.defaultValue === 'auto' ? 'color "#rrggbb" or "auto"' : 'color "#rrggbb"'),
  number: (definition) => `number from ${definition.min} to ${definition.max}`,
  boolean: () => 'true | false',
};

function parameterLine([name, definition]: [string, ParameterDefinition]): string {
  return `- ${name}: ${VALUES[definition.type](definition)} (default ${JSON.stringify(definition.defaultValue)})`;
}

/** Every rig and its parameters, from the rig catalog: what a new character may use. */
export function rigReference(rigs: RigCatalog): string {
  return rigs
    .ids()
    .map((id) => [`## rig "${id}"`, ...Object.entries(rigs.definition(id) ?? {}).map(parameterLine)].join('\n'))
    .join('\n\n');
}
