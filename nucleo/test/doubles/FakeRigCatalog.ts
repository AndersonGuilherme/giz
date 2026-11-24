import type { RigCatalog, ParameterDefinitions } from '../../src/application/ports/RigCatalog.ts';

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
}
