// Where the main process and its workers find core. Vite writes them to .vite/build/; three folders up is the folder
// that holds core/:
//   checkout:       studio/.vite/build/main.cjs           → ../../../core = the repository's core/
//   installed app:  resources/app.asar/.vite/build/main.cjs → ../../../core = resources/core (outside the asar)
// The packaging puts core (its sources, data, production modules and the prebuilt Remotion bundle) in resources/core,
// see scripts/stageCore.ts. Outside the asar, Node strips its types as it does in a checkout (it never strips files
// inside node_modules nor reads an asar for that), and its native modules load from real files.
const CORE_FROM_BUILD = '../../../core';

/** `gizzycera-core/<path>` as the built files import it: by its path from .vite/build. */
export const coreOutsideTheBundle = (id: string): string => id.replace(/^gizzycera-core(?=\/|$)/, CORE_FROM_BUILD);

// Bundled into the built files instead: plain modules (no import.meta.url, nothing native) that the main process
// needs before core first loads or in a synchronous read, for what was set up before the rename to Gizzycera.
const BUNDLED = String.raw`src/(infrastructure/config/formerNames|domain/cast/formerRigIds)\.ts$`;

/** The imports of the built main process and workers that stay outside the bundle: all of core but BUNDLED. */
export const CORE_EXTERNAL = new RegExp(String.raw`^gizzycera-core(?!/${BUNDLED})(/.*)?$`);

export const coreIsExternal = (id: string): boolean => CORE_EXTERNAL.test(id);
