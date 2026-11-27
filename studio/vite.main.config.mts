import { defineConfig } from 'vite';
import { coreOutsideTheBundle } from './config/coreLocation.ts';

// Core stays outside the bundle: it runs as its own TypeScript source from its package folder (its composition point
// finds the Remotion entry, the sounds and its native dependencies, Remotion and ONNX, from there). The built files
// reach it by a path relative to themselves, the same in a checkout and in the installed app (see coreLocation.ts).
export default defineConfig({
  build: { rollupOptions: { external: [/^giz-core(\/.*)?$/], output: { paths: coreOutsideTheBundle } } },
});
