// Core's parts the Cast, Scenarios and Voices stages use, loaded on first use (like coreModules.ts).
export type CoreCasting = typeof import('giz-core/src/presentation/cli/composition/casting.ts');
export type CoreImages = typeof import('giz-core/src/presentation/cli/composition/images.ts');
export type CoreMain = typeof import('giz-core/src/presentation/cli/composition.ts');
export type CoreStages = typeof import('giz-core/src/presentation/cli/composition/status.ts');
export type CoreLanguage = typeof import('giz-core/src/domain/values/Language.ts');
export type CoreAspect = typeof import('giz-core/src/domain/values/AspectRatio.ts');
export type CoreImageFiles = typeof import('giz-core/src/infrastructure/disk/imageSize.ts');
export type CoreWav = typeof import('giz-core/src/infrastructure/voice/wav.ts');
export type CoreCost = typeof import('giz-core/src/domain/ai/CostEstimate.ts');
export type CoreScriptMaterials = typeof import('giz-core/src/presentation/cli/composition/script.ts');
export type CoreWorkshop = typeof import('giz-core/src/presentation/cli/composition/voiceWorkshop.ts');

export const coreCasting = (): Promise<CoreCasting> => import('giz-core/src/presentation/cli/composition/casting.ts');
export const coreImages = (): Promise<CoreImages> => import('giz-core/src/presentation/cli/composition/images.ts');
export const coreMain = (): Promise<CoreMain> => import('giz-core/src/presentation/cli/composition.ts');
export const coreStages = (): Promise<CoreStages> => import('giz-core/src/presentation/cli/composition/status.ts');
export const coreLanguage = (): Promise<CoreLanguage> => import('giz-core/src/domain/values/Language.ts');
export const coreAspect = (): Promise<CoreAspect> => import('giz-core/src/domain/values/AspectRatio.ts');
export const coreImageFiles = (): Promise<CoreImageFiles> => import('giz-core/src/infrastructure/disk/imageSize.ts');
export const coreWav = (): Promise<CoreWav> => import('giz-core/src/infrastructure/voice/wav.ts');
export const coreCostEstimate = (): Promise<CoreCost> => import('giz-core/src/domain/ai/CostEstimate.ts');
export const coreScriptMaterials = (): Promise<CoreScriptMaterials> => import('giz-core/src/presentation/cli/composition/script.ts');
export const coreWorkshop = (): Promise<CoreWorkshop> => import('giz-core/src/presentation/cli/composition/voiceWorkshop.ts');
