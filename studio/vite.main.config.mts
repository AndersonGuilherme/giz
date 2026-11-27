import { defineConfig } from 'vite';

// Core stays outside the bundle: it runs as its own TypeScript source from its package folder (its composition point
// finds the Remotion entry and the sounds from there), with its native dependencies (Remotion, ONNX) in core/node_modules.
export default defineConfig({
  build: { rollupOptions: { external: [/^giz-core(\/.*)?$/] } },
});
