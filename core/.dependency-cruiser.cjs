/** Layer rules of core. The only exception is the composition point: src/presentation/cli/composition.ts and its parts in composition/. */
const DOMAIN = '^src/domain/';
const APPLICATION = '^src/application/';
const INFRASTRUCTURE = '^src/infrastructure/';
const PRESENTATION = '^src/presentation/';
const COMPOSITION = '^src/presentation/cli/composition(\\.ts|/[^/]+\\.ts)$';
// Every Node built-in, as depcruise names them (fs, node:fs, fs/promises, node:test...).
const NODE_BUILT_INS = `^(node:)?(${require('node:module').builtinModules.map((name) => name.replace(/^node:/, '')).join('|')})(/|$)`;

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
    {
      name: 'studio-drawing-is-web-only',
      comment: 'src/presentation/studio is drawn in the Studio window (a web page): nothing it reaches may need Node.',
      severity: 'error',
      from: { path: '^src/presentation/studio/' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'studio-drawing-reaches-no-node',
      comment: 'Nor anything it reaches (reachable rules take no dependencyTypes, so every Node built-in is named) and no adapter.',
      severity: 'error',
      from: { path: '^src/presentation/studio/' },
      to: { reachable: true, path: [NODE_BUILT_INS, '^src/infrastructure/'] },
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
