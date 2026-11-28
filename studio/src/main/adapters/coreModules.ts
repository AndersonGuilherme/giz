// Core's composition parts the Studio uses, loaded on first use (core runs as its own TypeScript source).
export type CoreTools = typeof import('gizzycera-core/src/presentation/cli/composition/tools.ts');
export type CoreInstall = typeof import('gizzycera-core/src/presentation/cli/composition/install.ts');
export type CoreText = typeof import('gizzycera-core/src/presentation/cli/composition/text.ts');

export const coreTools = (): Promise<CoreTools> => import('gizzycera-core/src/presentation/cli/composition/tools.ts');
export const coreInstall = (): Promise<CoreInstall> => import('gizzycera-core/src/presentation/cli/composition/install.ts');
export const coreText = (): Promise<CoreText> => import('gizzycera-core/src/presentation/cli/composition/text.ts');
export type CoreComposition = typeof import('gizzycera-core/src/presentation/cli/composition.ts');
export type CoreScript = typeof import('gizzycera-core/src/presentation/cli/composition/script.ts');
export type CoreStatus = typeof import('gizzycera-core/src/presentation/cli/composition/status.ts');
export type CoreEditing = typeof import('gizzycera-core/src/presentation/cli/composition/editing.ts');
export type CoreIdea = typeof import('gizzycera-core/src/domain/idea/Idea.ts');
export type CoreCost = typeof import('gizzycera-core/src/domain/ai/CostEstimate.ts');

export const coreComposition = (): Promise<CoreComposition> => import('gizzycera-core/src/presentation/cli/composition.ts');
export const coreScript = (): Promise<CoreScript> => import('gizzycera-core/src/presentation/cli/composition/script.ts');
export const coreStatus = (): Promise<CoreStatus> => import('gizzycera-core/src/presentation/cli/composition/status.ts');
export const coreEditing = (): Promise<CoreEditing> => import('gizzycera-core/src/presentation/cli/composition/editing.ts');
export const coreIdea = (): Promise<CoreIdea> => import('gizzycera-core/src/domain/idea/Idea.ts');
export const coreCost = (): Promise<CoreCost> => import('gizzycera-core/src/domain/ai/CostEstimate.ts');
export type CoreGeneration = typeof import('gizzycera-core/src/application/use-cases/script/GenerateScript.ts');
export const coreGeneration = (): Promise<CoreGeneration> => import('gizzycera-core/src/application/use-cases/script/GenerateScript.ts');
