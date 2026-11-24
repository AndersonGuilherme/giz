import type { RigCatalog, ParameterDefinitions } from '../../src/application/ports/RigCatalog.ts';
import type { StanceData } from '../../src/domain/scenario/Stance.ts';

const TEST_RIG: ParameterDefinitions = {
  skin: { type: 'color', defaultValue: '#f0c8a0' },
  height: { type: 'number', defaultValue: 1, min: 0.5, max: 1.5 },
  hair: { type: 'option', defaultValue: 'short', options: ['short', 'long'] },
  glasses: { type: 'boolean', defaultValue: false },
};

export class FakeRigCatalog implements RigCatalog {
  definition(rigId: string): ParameterDefinitions | undefined {
    return rigId === 'test' ? TEST_RIG : undefined;
  }

  ids(): string[] {
    return ['test'];
  }

  /** The test rig draws in a 100 × 100 box with the soles at the bottom middle; it reaches `top` when given. */
  stance(rigId: string, parameters: Readonly<Record<string, unknown>> = {}): StanceData | undefined {
    if (rigId !== 'test') return undefined;
    const top = typeof parameters.top === 'number' ? parameters.top : undefined;
    return { viewBox: { x: 0, y: 0, width: 100, height: 100 }, feet: { x: 50, y: 100 }, ...(top === undefined ? {} : { top }) };
  }
}
