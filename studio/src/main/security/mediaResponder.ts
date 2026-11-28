import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MEDIA_TYPES, mediaPathOf } from '../services/media/mediaUrls.ts';

/** `allowed`: whether the media scheme may serve that file; `fetch`: reads a file:// URL (Electron's net.fetch). */
type Parts = Readonly<{ allowed: (path: string) => boolean; fetch: (url: string, init: Readonly<{ headers: Headers }>) => Promise<Response> }>;

const NOT_FOUND = () => new Response(null, { status: 404 });
// Fonts load in CORS mode; nothing else needs to be readable across origins.
const FONT_TYPES: ReadonlySet<string> = new Set(['font/ttf']);

// The type from the extension, never what the file system guessed; no cache; CORS for a font only.
function headersOf(answer: Response, path: string): Headers {
  const headers = new Headers(answer.headers);
  const type = MEDIA_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
  headers.set('content-type', type);
  headers.set('cache-control', 'no-store');
  if (FONT_TYPES.has(type)) headers.set('access-control-allow-origin', '*');
  return headers;
}

/**
 * The answer to a `gizzy-media://file/<path>` request: only the types of MEDIA_TYPES (pictures, WAV audio, rendered MP4
 * videos, core's fonts), only where `allowed` says; anything else is a 404, so the page cannot read any other file of
 * the disk through it. The type comes from the extension. A font (loaded in CORS mode) alone says any origin may
 * read it (only our window ever reaches this scheme).
 */
export function mediaResponder({ allowed, fetch }: Parts): (request: Request) => Promise<Response> {
  return async (request) => {
    const path = mediaPathOf(request.url);
    if (!path || !allowed(path)) return NOT_FOUND();
    const answer = await fetch(pathToFileURL(path).href, { headers: request.headers }).catch(() => undefined);
    if (!answer?.ok) return NOT_FOUND();
    return new Response(answer.body, { status: answer.status, headers: headersOf(answer, path) });
  };
}
