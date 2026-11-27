import type { CostEstimate } from '../../domain/ai/CostEstimate.ts';
import type { ImageProviderName } from '../../domain/ai/ImageProviderName.ts';
import type { PixelSize } from '../../domain/scenario/ScenarioImageFrame.ts';

/** One image: what to draw, the size wanted (the service may give the nearest it makes, same aspect) and a seed. */
export type ImageRequest = Readonly<{ prompt: string; size: PixelSize; seed?: number }>;
/** The image file as the service made it (`mime`: image/png, image/jpeg...). */
export type GeneratedImage = Readonly<{ bytes: Uint8Array; mime: string }>;
/** Which service and model make the images (part of the cache key: another model makes another image). */
export type ImageModel = Readonly<{ provider: ImageProviderName; model: string }>;

/** An image AI (GPT Image, Gemini, Flux...): the image of a request and, before calling, what it can cost. */
export interface ImageProvider {
  generate(request: ImageRequest): Promise<GeneratedImage>;
  estimate(request: ImageRequest): CostEstimate;
  identity(): ImageModel;
}
