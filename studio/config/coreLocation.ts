// Where the main process and its workers find core. Vite writes them to .vite/build/; three folders up is the folder
// that holds core/:
//   checkout:       studio/.vite/build/main.cjs           → ../../../core = the repository's core/
//   installed app:  resources/app.asar/.vite/build/main.cjs → ../../../core = resources/core (outside the asar)
// The packaging puts core (its sources, data, production modules and the prebuilt Remotion bundle) in resources/core,
// see scripts/stageCore.ts. Outside the asar, Node strips its types as it does in a checkout (it never strips files
// inside node_modules nor reads an asar for that), and its native modules load from real files.
const CORE_FROM_BUILD = '../../../core';

/** `giz-core/<path>` as the built files import it: by its path from .vite/build. */
export const coreOutsideTheBundle = (id: string): string => id.replace(/^giz-core(?=\/|$)/, CORE_FROM_BUILD);
