import { createHash } from 'node:crypto';

// The Remotion Player puts one <style> in the page (box sizing inside the player, full-screen size, object-fit). The
// packaged page allows no inline style, so that one is allowed by the hash of its exact text, computed from the
// installed Remotion itself: an upgrade that changes the text changes the hash with it.
const PLAYER_CLASS = '.__remotion-player';
const PLAYER_BACKGROUND = '#fff';

type Remotion = { Internals: { CSSUtils: { makeDefaultPreviewCSS: (scope: string, background: string) => string } } };

/** `'sha256-…'` of the Player's own style, ready for style-src. */
export async function playerStyleHash(): Promise<string> {
  const { Internals } = (await import('remotion')) as unknown as Remotion;
  const css = Internals.CSSUtils.makeDefaultPreviewCSS(PLAYER_CLASS, PLAYER_BACKGROUND);
  return `'sha256-${createHash('sha256').update(css).digest('base64')}'`;
}
