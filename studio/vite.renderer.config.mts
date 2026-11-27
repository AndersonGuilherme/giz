import { defineConfig } from 'vite';

// JSX with React's automatic runtime (Vite's own transform, no React plugin: no inline refresh script, so the page
// keeps a strict Content-Security-Policy without 'unsafe-inline' scripts).
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'react' } },
});
