import type { RigCatalog, ParameterDefinitions } from '../../application/ports/RigCatalog.ts';
import { currentRigId } from '../../domain/cast/formerRigIds.ts';
import type { ParameterValue } from '../../domain/cast/Character.ts';
import type { StanceData } from '../../domain/scenario/Stance.ts';
import type { RigDefinition } from './RigModel.ts';
import type { RigRegistry } from './rigRegistry.ts';

/** The real rig catalog: parameter definitions come from the rig registry (a former rig id gives the rig it is now). */
export class RigCatalogFromRegistry implements RigCatalog {
  readonly #registry: RigRegistry<RigDefinition>;

  constructor(registry: RigRegistry<RigDefinition>) {
    this.#registry = registry;
  }

  definition(rigId: string): ParameterDefinitions | undefined {
    return this.#rigOf(rigId)?.parameters;
  }

  ids(): string[] {
    return this.#registry.all().map(({ id }) => id);
  }

  stance(rigId: string, parameters: Readonly<Record<string, ParameterValue>>): StanceData | undefined {
    const rig = this.#rigOf(rigId);
    if (!rig) return undefined;
    return rig.reach ? { ...rig.stance, top: rig.reach(parameters) } : rig.stance;
  }

  #rigOf(rigId: string): RigDefinition | undefined {
    const current = currentRigId(rigId);
    return this.#registry.all().find(({ id }) => id === current);
  }
}
