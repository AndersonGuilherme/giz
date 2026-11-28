import type { Plugin } from 'vite';
import { playerStyleHash } from './playerStyle.ts';

type Directives = Readonly<Record<string, readonly string[]>>;

// The packaged page: only its own files, no inline code, no network.
const STRICT: Directives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  // gizzy-media: the projects' pictures and audio, served by the main process from the granted folders only;
  // blob: a take just recorded, played before it is saved; data: the Remotion Player's silent shared audio (a tiny
  // mp3 it plays to unlock sound before the real one).
  'img-src': ["'self'", 'data:', 'gizzy-media:'],
  'media-src': ["'self'", 'gizzy-media:', 'blob:', 'data:'],
  // The video preview's fonts (Nunito, JetBrains Mono) are bundled with core and served from its fonts folder; the
  // window's own Nunito is in the page's files. No network origin anywhere.
  'font-src': ["'self'", 'gizzy-media:'],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
};

// Only while Vite serves the page: its hot-reload websocket and the <style> tags it injects.
const DEV_SERVER_EXTRAS: Directives = { 'style-src': ["'unsafe-inline'"], 'connect-src': ['ws://localhost:*'] };

/**
 * `styleHashes`: the inline styles the packaged page allows by hash (the Remotion Player's own, see playerStyle.ts).
 * Not with the dev server: a hash in style-src makes the browser ignore its 'unsafe-inline'.
 */
export function contentSecurityPolicy(serving: boolean, styleHashes: readonly string[] = []): string {
  const extras = serving ? DEV_SERVER_EXTRAS : { 'style-src': styleHashes };
  return Object.entries(STRICT)
    .map(([directive, sources]) => [directive, ...sources, ...(extras[directive] ?? [])].join(' '))
    .join('; ');
}

/** Adds the Content-Security-Policy meta tag to index.html: the strict one in builds, the dev one in `vite serve`. */
export function contentSecurityPlugin(): Plugin {
  let serving = false;
  return {
    name: 'gizzy-content-security',
    configResolved: (config) => void (serving = config.command === 'serve'),
    transformIndexHtml: async () => {
      const content = contentSecurityPolicy(serving, [await playerStyleHash()]);
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content }, injectTo: 'head-prepend' }];
    },
  };
}
