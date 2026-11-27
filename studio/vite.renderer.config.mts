import { defineConfig } from 'vite';
import { contentSecurityPlugin } from './config/contentSecurity.ts';

// JSX with React's automatic runtime (Vite's own transform, no React plugin: no inline refresh script, so the page
// keeps a Content-Security-Policy without inline scripts). The policy itself comes from the plugin.
// The window draws characters and backgrounds with core's own components (giz-core/src/presentation/studio): one
// React and one Remotion for the page and core's files (the Player and the drawings must share Remotion's context),
// and the dev server may read core's sources (outside this folder). Core is served as source, never pre-bundled: a
// pre-bundled copy goes stale when core's drawings change (a new export would be missing until the cache is cleared).
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  plugins: [contentSecurityPlugin()],
  resolve: { dedupe: ['react', 'react-dom', 'remotion'] },
  optimizeDeps: { exclude: ['giz-core'], include: ['remotion', 'react', 'react/jsx-runtime', 'react-dom'] },
  server: { fs: { allow: ['.', '../core/src'] } },
});
