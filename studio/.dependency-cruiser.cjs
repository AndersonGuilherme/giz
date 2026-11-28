/**
 * Layer rules of the Studio. The renderer is a web page: no Node, no Electron, no main-process code; it reaches the
 * machine only through `window.gizzy`. The preload only relays IPC. The main-process services depend on ports, never on
 * Electron or the adapters; only src/main/composition.ts wires the adapters in.
 */
const MAIN = '^src/main/';
const PRELOAD = '^src/preload/';
const RENDERER = '^src/renderer/';
const SHARED = '^src/shared/';
const SERVICES = '^src/main/(services|ports|ipc)/';
const ADAPTERS = '^src/main/adapters/';
const CORE_DRAWINGS = '^(\\.\\./core|node_modules/gizzycera-core)/src/presentation/studio/index\\.ts$';
const COMPOSITION = '^src/main/composition(\\.ts|/[^/]+\\.ts)$';
// A worker process's entry is that process's own composition point (it wires the adapters it runs).
const WORKER_ENTRY = '^src/main/worker/[a-zA-Z]+Worker\\.ts$';

module.exports = {
  forbidden: [
    {
      name: 'renderer-no-node-nor-electron',
      comment: 'The renderer runs sandboxed in the page: Node built-ins and electron are not there.',
      severity: 'error',
      from: { path: RENDERER },
      to: { dependencyTypes: ['core'] },
    },
    { name: 'renderer-no-electron', severity: 'error', from: { path: RENDERER }, to: { path: '^(node_modules/)?electron(/|$)' } },
    {
      name: 'renderer-only-renderer-and-shared',
      comment: "Of core, the renderer imports only its web drawings (src/presentation/studio/index.ts, kept free of Node by core's own rules).",
      severity: 'error',
      from: { path: RENDERER },
      to: { path: [MAIN, PRELOAD, 'gizzycera-core', '^\\.\\./core/'], pathNot: CORE_DRAWINGS },
    },
    { name: 'preload-only-shared', severity: 'error', from: { path: PRELOAD }, to: { path: [MAIN, RENDERER, 'gizzycera-core', '^\\.\\./core/', 'zod'] } },
    { name: 'main-not-renderer-nor-preload', severity: 'error', from: { path: MAIN }, to: { path: [RENDERER, PRELOAD] } },
    {
      name: 'shared-is-plain',
      comment: 'shared is imported by all three: no Node, no Electron, no zod, nothing of main/preload/renderer.',
      severity: 'error',
      from: { path: SHARED },
      to: { pathNot: [SHARED] },
    },
    {
      name: 'services-no-electron-nor-adapters',
      comment: 'The services are tested with fakes under plain Node: ports only.',
      severity: 'error',
      from: { path: SERVICES },
      to: { path: [ADAPTERS, '^(node_modules/)?electron(/|$)', COMPOSITION] },
    },
    {
      name: 'adapters-only-composition',
      severity: 'error',
      from: { path: MAIN, pathNot: [COMPOSITION, ADAPTERS, WORKER_ENTRY] },
      to: { path: ADAPTERS },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: ['node_modules', '^\\.\\./core/'] },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
  },
};
