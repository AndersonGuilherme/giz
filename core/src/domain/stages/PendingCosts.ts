import { CostEstimate } from '../ai/CostEstimate.ts';

/** The script generation (when it is pending): its upper bound, or unknown with the reason. */
export type TextCost = Readonly<{ cost: CostEstimate; problem?: string }>;
/** How many items are pending and what they cost; `count` undefined when it is not known (the project does not load). */
export type CostPart = Readonly<{ count?: number; cost: CostEstimate }>;
export type PendingCosts = Readonly<{ text?: TextCost; images: CostPart; voices: CostPart; total: CostEstimate }>;

/** The pending paid steps: the script (absent when not pending), each image and each voice (undefined: not known). */
export type PendingWork = Readonly<{ text?: TextCost; images: readonly CostEstimate[] | undefined; voices: readonly CostEstimate[] | undefined }>;

function partOf(costs: readonly CostEstimate[] | undefined): CostPart {
  if (!costs) return { cost: CostEstimate.UNKNOWN };
  return { count: costs.length, cost: costs.reduce((total, cost) => total.plus(cost), CostEstimate.ZERO) };
}

/** What the pending steps cost in all; one unknown part makes the total unknown (never a guess). */
export function pendingCosts(work: PendingWork): PendingCosts {
  const [images, voices] = [partOf(work.images), partOf(work.voices)];
  const text = work.text?.cost ?? CostEstimate.ZERO;
  return { text: work.text, images, voices, total: text.plus(images.cost).plus(voices.cost) };
}
