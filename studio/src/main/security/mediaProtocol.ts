import { net, protocol } from 'electron';
import { MEDIA_SCHEME } from '../services/media/mediaUrls.ts';
import { mediaResponder } from './mediaResponder.ts';

/**
 * Before the app is ready: the media scheme is a secure one the page may load pictures, audio, videos and fonts from
 * (and stream); `corsEnabled` lets a font (always a CORS load) come from it.
 */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([{ scheme: MEDIA_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);
}

/**
 * Serves `gizzy-media://file/<path>`: only the media types (pictures, WAV audio, rendered videos, core's fonts), only
 * inside a folder the media scheme may serve (`allowed`: the granted project folders and the Studio's own folders:
 * the voice samples, core's sounds and fonts); anything else is a 404.
 */
export function serveMedia(allowed: (path: string) => boolean): void {
  protocol.handle(MEDIA_SCHEME, mediaResponder({ allowed, fetch: (url, init) => net.fetch(url, init) }));
}
