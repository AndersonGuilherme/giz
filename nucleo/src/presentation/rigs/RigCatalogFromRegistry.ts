import type { RigCatalog, ParameterDefinitions } from '../../application/ports/RigCatalog.ts';
import type { RigDefinition } from './RigModel.ts';
import type { RigRegistry } from './rigRegistry.ts';

/** The real rig catalog: parameter definitions come from the rig registry. */
export class RigCatalogFromRegistry implements RigCatalog {
  readonly #registry: RigRegistry<RigDefinition>;

  constructor(registry: RigRegistry<RigDefinition>) {
    this.#registry = registry;
  }

  definition(rigId: string): ParameterDefinitions | undefined {
    return this.#registry.all().find(({ id }) => id === rigId)?.parameters;
  }

  ids(): string[] {
    return this.#registry.all().map(({ id }) => id);
  }
}
