import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { net, protocol } from 'electron';
import { MEDIA_SCHEME, MEDIA_TYPES, mediaPathOf } from '../services/media/mediaUrls.ts';

/** Before the app is ready: the media scheme is a secure one the page may load pictures and audio from (and stream). */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([{ scheme: MEDIA_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
}

/**
 * Serves `giz-media://file/<path>`: only pictures and WAV audio, only inside a folder the person gave the Studio
 * (`allowed`); anything else is a 404, so the page cannot read any other file of the disk through it.
 */
export function serveMedia(allowed: (path: string) => boolean): void {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    const path = mediaPathOf(request.url);
    if (!path || !allowed(path)) return new Response(null, { status: 404 });
    const answer = await net.fetch(pathToFileURL(path).href, { headers: request.headers }).catch(() => undefined);
    if (!answer?.ok) return new Response(null, { status: 404 });
    const headers = new Headers(answer.headers);
    headers.set('content-type', MEDIA_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream');
    headers.set('cache-control', 'no-store');
    return new Response(answer.body, { status: answer.status, headers });
  });
}
