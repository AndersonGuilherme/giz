import { currentRigId } from '../../domain/cast/formerRigIds.ts';
import { gizzyDefinition } from './gizzy/parameters.ts';
import { liaStyleDefinition } from './lia-style/parameters.ts';
import type { RigDefinition } from './RigModel.ts';

/** Rigs by id. The same registry serves the definitions (Node) and the models with a component (Remotion). */
export class RigRegistry<Rig extends RigDefinition> {
  readonly #byId = new Map<string, Rig>();

  private constructor() {}

  static with<Rig extends RigDefinition>(rigs: readonly Rig[]): RigRegistry<Rig> {
    const registry = new RigRegistry<Rig>();
    rigs.forEach((rig) => registry.register(rig));
    return registry;
  }

  register(rig: Rig): void {
    if (this.#byId.has(rig.id)) throw new Error(`rig "${rig.id}" já registrado`);
    this.#byId.set(rig.id, rig);
  }

  /** By id; a former id (from before the rename to Gizzycera) gives the rig it is now. */
  get(id: string): Rig {
    const rig = this.#byId.get(currentRigId(id));
    if (!rig) throw new Error(`rig "${id}" desconhecido (use ${[...this.#byId.keys()].join(', ')})`);
    return rig;
  }

  all(): readonly Rig[] {
    return [...this.#byId.values()];
  }
}

/** The definitions, in plain `.ts`: the CLI imports this module without loading React or `.tsx`. */
export const rigRegistry = RigRegistry.with<RigDefinition>([gizzyDefinition, liaStyleDefinition]);
