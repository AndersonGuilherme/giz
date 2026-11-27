import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MEDIA_TYPES, mediaPathOf } from '../services/media/mediaUrls.ts';

/** `allowed`: whether the media scheme may serve that file; `fetch`: reads a file:// URL (Electron's net.fetch). */
type Parts = Readonly<{ allowed: (path: string) => boolean; fetch: (url: string, init: Readonly<{ headers: Headers }>) => Promise<Response> }>;

const NOT_FOUND = () => new Response(null, { status: 404 });

/**
 * The answer to a `giz-media://file/<path>` request: only pictures and WAV audio, only where `allowed` says; anything
 * else is a 404, so the page cannot read any other file of the disk through it. The type comes from the extension.
 */
export function mediaResponder({ allowed, fetch }: Parts): (request: Request) => Promise<Response> {
  return async (request) => {
    const path = mediaPathOf(request.url);
    if (!path || !allowed(path)) return NOT_FOUND();
    const answer = await fetch(pathToFileURL(path).href, { headers: request.headers }).catch(() => undefined);
    if (!answer?.ok) return NOT_FOUND();
    const headers = new Headers(answer.headers);
    headers.set('content-type', MEDIA_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream');
    headers.set('cache-control', 'no-store');
    return new Response(answer.body, { status: answer.status, headers });
  };
}
