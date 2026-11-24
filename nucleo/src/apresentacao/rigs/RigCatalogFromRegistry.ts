import type { CatalogoDeRigs, DefinicaoDeParametros } from '../../aplicacao/portas/CatalogoDeRigs.ts';
import type { RigDefinition } from './RigModel.ts';
import type { RigRegistry } from './rigRegistry.ts';

/** The real rig catalog: parameter definitions come from the rig registry. */
export class RigCatalogFromRegistry implements CatalogoDeRigs {
  readonly #registry: RigRegistry<RigDefinition>;

  constructor(registry: RigRegistry<RigDefinition>) {
    this.#registry = registry;
  }

  definicao(idRig: string): DefinicaoDeParametros | undefined {
    return this.#registry.all().find(({ id }) => id === idRig)?.parameters;
  }

  ids(): string[] {
    return this.#registry.all().map(({ id }) => id);
  }
}
