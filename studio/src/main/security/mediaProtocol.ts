import { net, protocol } from 'electron';
import { MEDIA_SCHEME } from '../services/media/mediaUrls.ts';
import { mediaResponder } from './mediaResponder.ts';

/** Before the app is ready: the media scheme is a secure one the page may load pictures and audio from (and stream). */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([{ scheme: MEDIA_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
}

/**
 * Serves `giz-media://file/<path>`: only pictures and WAV audio, only inside a folder the media scheme may serve
 * (`allowed`: the granted project folders and the Studio's own media folders); anything else is a 404.
 */
export function serveMedia(allowed: (path: string) => boolean): void {
  protocol.handle(MEDIA_SCHEME, mediaResponder({ allowed, fetch: (url, init) => net.fetch(url, init) }));
}
