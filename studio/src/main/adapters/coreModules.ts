// Core's composition parts the Studio uses, loaded on first use (core runs as its own TypeScript source).
export type CoreTools = typeof import('giz-core/src/presentation/cli/composition/tools.ts');
export type CoreInstall = typeof import('giz-core/src/presentation/cli/composition/install.ts');
export type CoreText = typeof import('giz-core/src/presentation/cli/composition/text.ts');

export const coreTools = (): Promise<CoreTools> => import('giz-core/src/presentation/cli/composition/tools.ts');
export const coreInstall = (): Promise<CoreInstall> => import('giz-core/src/presentation/cli/composition/install.ts');
export const coreText = (): Promise<CoreText> => import('giz-core/src/presentation/cli/composition/text.ts');
export type CoreComposition = typeof import('giz-core/src/presentation/cli/composition.ts');
export type CoreScript = typeof import('giz-core/src/presentation/cli/composition/script.ts');
export type CoreStatus = typeof import('giz-core/src/presentation/cli/composition/status.ts');
export type CoreEditing = typeof import('giz-core/src/presentation/cli/composition/editing.ts');
export type CoreIdea = typeof import('giz-core/src/domain/idea/Idea.ts');
export type CoreCost = typeof import('giz-core/src/domain/ai/CostEstimate.ts');

export const coreComposition = (): Promise<CoreComposition> => import('giz-core/src/presentation/cli/composition.ts');
export const coreScript = (): Promise<CoreScript> => import('giz-core/src/presentation/cli/composition/script.ts');
export const coreStatus = (): Promise<CoreStatus> => import('giz-core/src/presentation/cli/composition/status.ts');
export const coreEditing = (): Promise<CoreEditing> => import('giz-core/src/presentation/cli/composition/editing.ts');
export const coreIdea = (): Promise<CoreIdea> => import('giz-core/src/domain/idea/Idea.ts');
export const coreCost = (): Promise<CoreCost> => import('giz-core/src/domain/ai/CostEstimate.ts');
