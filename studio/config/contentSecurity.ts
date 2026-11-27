import type { Plugin } from 'vite';

type Directives = Readonly<Record<string, readonly string[]>>;

// The packaged page: only its own files, no inline code, no network.
const STRICT: Directives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  // giz-media: the projects' pictures and audio, served by the main process from the granted folders only;
  // blob: a take just recorded, played before it is saved.
  'img-src': ["'self'", 'data:', 'giz-media:'],
  'media-src': ["'self'", 'giz-media:', 'blob:'],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
};

// Only while Vite serves the page: its hot-reload websocket and the <style> tags it injects.
const DEV_SERVER_EXTRAS: Directives = { 'style-src': ["'unsafe-inline'"], 'connect-src': ['ws://localhost:*'] };

export function contentSecurityPolicy(serving: boolean): string {
  const extras = serving ? DEV_SERVER_EXTRAS : {};
  return Object.entries(STRICT)
    .map(([directive, sources]) => [directive, ...sources, ...(extras[directive] ?? [])].join(' '))
    .join('; ');
}

/** Adds the Content-Security-Policy meta tag to index.html: the strict one in builds, the dev one in `vite serve`. */
export function contentSecurityPlugin(): Plugin {
  let serving = false;
  return {
    name: 'giz-content-security',
    configResolved: (config) => void (serving = config.command === 'serve'),
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: contentSecurityPolicy(serving) }, injectTo: 'head-prepend' }],
  };
}
