import { defineConfig } from 'vite';
import { contentSecurityPlugin } from './config/contentSecurity.ts';

// JSX with React's automatic runtime (Vite's own transform, no React plugin: no inline refresh script, so the page
// keeps a Content-Security-Policy without inline scripts). The policy itself comes from the plugin.
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
  plugins: [contentSecurityPlugin()],
});
