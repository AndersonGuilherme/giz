// Core's composition parts the Studio uses, loaded on first use (core runs as its own TypeScript source).
export type CoreTools = typeof import('giz-core/src/presentation/cli/composition/tools.ts');
export type CoreInstall = typeof import('giz-core/src/presentation/cli/composition/install.ts');
export type CoreText = typeof import('giz-core/src/presentation/cli/composition/text.ts');

export const coreTools = (): Promise<CoreTools> => import('giz-core/src/presentation/cli/composition/tools.ts');
export const coreInstall = (): Promise<CoreInstall> => import('giz-core/src/presentation/cli/composition/install.ts');
export const coreText = (): Promise<CoreText> => import('giz-core/src/presentation/cli/composition/text.ts');
