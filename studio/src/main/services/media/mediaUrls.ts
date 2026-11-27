import { extname, isAbsolute, normalize } from 'node:path';

/** The scheme the window loads the projects' pictures and audio from (the main process serves only granted folders). */
export const MEDIA_SCHEME = 'giz-media';
const PREFIX = `${MEDIA_SCHEME}://file/`;
/** The only files the scheme serves: pictures, the lines' audio, the rendered videos and core's bundled fonts. */
export const MEDIA_TYPES: Readonly<Record<string, string>> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.ttf': 'font/ttf' };

/** The URL of a file for the window; `version` (its last change) makes a changed file load again. */
export function mediaUrlOf(path: string, version: number): string {
  return `${PREFIX}${encodeURIComponent(path)}?v=${Math.round(version)}`;
}

function decoded(text: string): string | undefined {
  try {
    return decodeURIComponent(text);
  } catch {
    return undefined;
  }
}

// Only a plain absolute path (no `..`, no null byte) of a type the scheme serves.
const servable = (path: string) => isAbsolute(path) && !path.includes('\0') && normalize(path) === path && MEDIA_TYPES[extname(path).toLowerCase()] !== undefined;

/** The file a media URL names, when it is an absolute path of a type the scheme serves; undefined otherwise. */
export function mediaPathOf(url: string): string | undefined {
  if (!url.startsWith(PREFIX)) return undefined;
  const path = decoded(url.slice(PREFIX.length).split('?')[0] ?? '');
  return path !== undefined && servable(path) ? path : undefined;
}
