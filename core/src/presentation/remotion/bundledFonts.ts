import { useEffect, useState } from 'react';
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

/**
 * Loads the bundled fonts before the first frame is taken (the render waits through delayRender). A font that does
 * not load is reported and the text falls back to the next family: the video is still drawn.
 */
export function useBundledFonts(): void {
  const source = useMediaSource();
  const [handle] = useState(() => delayRender('giz: the bundled fonts'));
  useEffect(() => {
    const faces = fontFacesOf(source).filter(({ url }) => url !== '');
    void Promise.all(faces.map(loaded))
      .catch((error: unknown) => console.error('giz: a bundled font did not load', error))
      .finally(() => continueRender(handle));
  }, [source, handle]);
}
