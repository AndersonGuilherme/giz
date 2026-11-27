import type { PixelSize } from '../scenario/ScenarioImageFrame.ts';
import { CostEstimate } from './CostEstimate.ts';
import type { ImageProviderName } from './ImageProviderName.ts';
import { imageTierOf, type ImageTier } from './ImageTier.ts';

/** What one image of a size costs with one model. */
type ImagePrice = (size: PixelSize) => CostEstimate;
type PriceList = Readonly<Record<string, ImagePrice>>;

const MEGAPIXEL = 1024 * 1024;
const TOKENS_PER_MILLION = 1_000_000;
const megapixels = (size: PixelSize): number => (size.width * size.height) / MEGAPIXEL;

// A fixed price per image for each resolution class (Gemini).
const perTier = (dollars: Readonly<Record<ImageTier, number>>): ImagePrice => (size) => CostEstimate.ofDollars(dollars[imageTierOf(size)]);
// Per megapixel, each started megapixel billed whole (fal.ai).
const perStartedMegapixel = (dollars: number): ImagePrice => (size) => CostEstimate.ofDollars(Math.ceil(megapixels(size)) * dollars);
// Per image output token, the tokens growing with the area (OpenAI).
const perOutputToken = (dollarsPerMillion: number, tokensPerMegapixel: number): ImagePrice => (size) =>
  CostEstimate.ofDollars((megapixels(size) * tokensPerMegapixel * dollarsPerMillion) / TOKENS_PER_MILLION);

// OpenAI does not list the tokens of a GPT-Image-2.5/2.6 image; this is its published table for the earlier models at
// medium quality (1584 tokens for 1024×1536), about 1031 tokens per megapixel: an approximation, not a quote.
const OPENAI_MEDIUM = perOutputToken(30, 1031);

// Standard prices in US$, checked on 2026-11-27 on each provider's pricing pages. A model missing here has an unknown cost.
const IMAGE_PRICES: Readonly<Record<ImageProviderName, PriceList>> = {
  openai: {
    'gpt-image-2.6-sunburst': OPENAI_MEDIUM,
    'gpt-image-2.6-flare': OPENAI_MEDIUM,
    'gpt-image-2.5-sunburst': OPENAI_MEDIUM,
    'gpt-image-2.5-flare': OPENAI_MEDIUM,
  },
  gemini: {
    'gemini-nano-banana-2.1': perTier({ '1K': 0.0336, '2K': 0.0504, '4K': 0.113 }),
  },
  fal: {
    'fal-ai/flux-2-pro': perStartedMegapixel(0.055),
  },
};

function priceOf(provider: ImageProviderName, model: string): ImagePrice | undefined {
  const prices = IMAGE_PRICES[provider];
  return Object.hasOwn(prices, model) ? prices[model] : undefined;
}

/** What one image of that size costs with the model; unknown for a model outside the table. */
export function imageCostEstimate(provider: ImageProviderName, model: string, size: PixelSize): CostEstimate {
  const price = priceOf(provider, model);
  return price ? price(size) : CostEstimate.UNKNOWN;
}
