import { useLayoutEffect } from 'react';
import { continueRender, delayRender } from 'remotion';
import { BUNDLED_FONTS } from '../scenes/fonts.ts';
import { useMediaSource } from './mediaSource.ts';

export type FontFaceSource = Readonly<{ family: string; url: string; weight: string }>;

/** Each bundled font at the URL the media source gives for its file (staticFile in the render, a served URL in the Studio). */
export function fontFacesOf(source: (path: string) => string): FontFaceSource[] {
  return BUNDLED_FONTS.map(({ family, file, weight }) => ({ family, url: source(file), weight }));
}

// One load per URL for the whole page: every composition (and every frame) reuses it.
const LOADS = new Map<string, Promise<void>>();

async function added({ family, url, weight }: FontFaceSource): Promise<void> {
  const face = new FontFace(family, `url(${JSON.stringify(url)})`, { weight });
  document.fonts.add(await face.load());
}

// A load that failed is forgotten, so the next composition tries again.
function loaded(face: FontFaceSource): Promise<void> {
  const known = LOADS.get(face.url) ?? added(face).catch((error: unknown) => {
    LOADS.delete(face.url);
    throw error;
  });
  LOADS.set(face.url, known);
  return known;
}

/** How the render is held: Remotion's delayRender and continueRender (tests pass their own). */
export type RenderHold<Handle> = Readonly<{ delay: () => Handle; release: (handle: Handle) => void }>;

/**
 * Holds the render while `load` runs and releases it exactly once: when the load ends (well or not), or when the view
 * goes first (the cleanup answered). Under StrictMode's mount, unmount and mount, no hold is left behind.
 */
export function holdWhileLoading<Handle>(load: () => Promise<unknown>, hold: RenderHold<Handle>): () => void {
  const handle = hold.delay();
  let held = true;
  const release = () => {
    if (held) hold.release(handle);
    held = false;
  };
  void load().catch(() => undefined).finally(release);
  return release;
}

const REMOTION_HOLD: RenderHold<number> = { delay: () => delayRender('Gizzycera: the bundled fonts'), release: continueRender };

/**
 * Loads the bundled fonts before the first frame is taken (the render waits through delayRender, asked during the
 * commit, before any frame). A font that does not load is reported and the text falls back to the next family.
 */
export function useBundledFonts(): void {
  const source = useMediaSource();
  useLayoutEffect(() => {
    const faces = fontFacesOf(source).filter(({ url }) => url !== '');
    const load = () => Promise.all(faces.map(loaded)).catch((error: unknown) => console.error('Gizzycera: a bundled font did not load', error));
    return holdWhileLoading(load, REMOTION_HOLD);
  }, [source]);
}
