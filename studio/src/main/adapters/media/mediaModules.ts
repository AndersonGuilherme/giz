// Core's parts the Cast, Scenarios and Voices stages use, loaded on first use (like coreModules.ts).
export type CoreCasting = typeof import('gizzycera-core/src/presentation/cli/composition/casting.ts');
export type CoreImages = typeof import('gizzycera-core/src/presentation/cli/composition/images.ts');
export type CoreMain = typeof import('gizzycera-core/src/presentation/cli/composition.ts');
export type CoreStages = typeof import('gizzycera-core/src/presentation/cli/composition/status.ts');
export type CoreLanguage = typeof import('gizzycera-core/src/domain/values/Language.ts');
export type CoreAspect = typeof import('gizzycera-core/src/domain/values/AspectRatio.ts');
export type CoreImageFiles = typeof import('gizzycera-core/src/infrastructure/disk/imageSize.ts');
export type CoreWav = typeof import('gizzycera-core/src/infrastructure/voice/wav.ts');
export type CoreCost = typeof import('gizzycera-core/src/domain/ai/CostEstimate.ts');
export type CoreScriptMaterials = typeof import('gizzycera-core/src/presentation/cli/composition/script.ts');
export type CoreWorkshop = typeof import('gizzycera-core/src/presentation/cli/composition/voiceWorkshop.ts');

export const coreCasting = (): Promise<CoreCasting> => import('gizzycera-core/src/presentation/cli/composition/casting.ts');
export const coreImages = (): Promise<CoreImages> => import('gizzycera-core/src/presentation/cli/composition/images.ts');
export const coreMain = (): Promise<CoreMain> => import('gizzycera-core/src/presentation/cli/composition.ts');
export const coreStages = (): Promise<CoreStages> => import('gizzycera-core/src/presentation/cli/composition/status.ts');
export const coreLanguage = (): Promise<CoreLanguage> => import('gizzycera-core/src/domain/values/Language.ts');
export const coreAspect = (): Promise<CoreAspect> => import('gizzycera-core/src/domain/values/AspectRatio.ts');
export const coreImageFiles = (): Promise<CoreImageFiles> => import('gizzycera-core/src/infrastructure/disk/imageSize.ts');
export const coreWav = (): Promise<CoreWav> => import('gizzycera-core/src/infrastructure/voice/wav.ts');
export const coreCostEstimate = (): Promise<CoreCost> => import('gizzycera-core/src/domain/ai/CostEstimate.ts');
export const coreScriptMaterials = (): Promise<CoreScriptMaterials> => import('gizzycera-core/src/presentation/cli/composition/script.ts');
export const coreWorkshop = (): Promise<CoreWorkshop> => import('gizzycera-core/src/presentation/cli/composition/voiceWorkshop.ts');
