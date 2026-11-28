import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// The Remotion Player puts one <style> in the page (box sizing inside the player, full-screen size, object-fit). The
// packaged page allows no inline style, so that one is allowed by the hash of its exact text, computed from the
// installed Remotion itself. The Player's other <style> blocks (the buffering spinner and the volume slider) are JSX
// inside its controls, which the Studio never turns on (its Players have no `controls`): they are never drawn, and the
// packaged smoke fails on any style the policy refuses.
const PLAYER_CLASS = '.__remotion-player';
const PLAYER_BACKGROUND = '#fff';
const UPDATE = 'the Remotion Player no longer injects the style config/playerStyle.ts hashes: update config/playerStyle.ts';

type Remotion = { Internals: { CSSUtils: { makeDefaultPreviewCSS: (scope: string, background: string) => string } } };

/** The installed @remotion/player's ESM build (what Vite bundles into the page). */
export const playerSource = (): Promise<string> => readFile(fileURLToPath(import.meta.resolve('@remotion/player')), 'utf8');

/** Throws unless `source` injects one style only, the default preview CSS of the default class on #fff. */
export function checkPlayerStyleSource(source: string): void {
  const injections = source.split('.injectCSS(').length - 1;
  const call = /\.CSSUtils\.injectCSS\(\w+\.CSSUtils\.makeDefaultPreviewCSS\(`\.\$\{playerCssClassname\(overrideInternalClassName\)\}`, "#fff"\)\)/;
  const defaultClass = 'return override ?? "__remotion-player"';
  if (injections !== 1 || !call.test(source) || !source.includes(defaultClass)) throw new Error(UPDATE);
}

/** `'sha256-…'` of the Player's own style, ready for style-src (after checking the Player still injects that one). */
export async function playerStyleHash(): Promise<string> {
  checkPlayerStyleSource(await playerSource());
  const { Internals } = (await import('remotion')) as unknown as Remotion;
  const css = Internals.CSSUtils.makeDefaultPreviewCSS(PLAYER_CLASS, PLAYER_BACKGROUND);
  return `'sha256-${createHash('sha256').update(css).digest('base64')}'`;
}
