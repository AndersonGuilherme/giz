/** Layer rules of the nucleo. The only exception is src/presentation/cli/composition.ts. */
const DOMAIN = '^src/domain/';
const APPLICATION = '^src/application/';
const INFRASTRUCTURE = '^src/infrastructure/';
const PRESENTATION = '^src/presentation/';
const COMPOSITION = '^src/presentation/cli/composition\\.ts$';

module.exports = {
  forbidden: [
    {
      name: 'domain-imports-only-domain',
      comment: 'domain imports nothing outside domain (no React, node:* or zod).',
      severity: 'error',
      from: { path: DOMAIN },
      to: { pathNot: DOMAIN },
    },
    {
      name: 'application-imports-only-domain',
      comment: 'application imports only domain (and itself).',
      severity: 'error',
      from: { path: APPLICATION },
      to: { pathNot: [APPLICATION, DOMAIN] },
    },
    {
      name: 'infrastructure-does-not-import-presentation',
      severity: 'error',
      from: { path: INFRASTRUCTURE },
      to: { path: PRESENTATION },
    },
    {
      name: 'presentation-does-not-import-infrastructure',
      comment: 'Single exception: the composition point.',
      severity: 'error',
      from: { path: PRESENTATION, pathNot: COMPOSITION },
      to: { path: INFRASTRUCTURE },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    includeOnly: undefined,
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
  },
};
