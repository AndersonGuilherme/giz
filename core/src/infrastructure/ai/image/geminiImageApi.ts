import { z } from 'zod';
import type { ImageRequest } from '../../../application/ports/ImageProvider.ts';
import { imageTierOf } from '../../../domain/ai/ImageTier.ts';
import type { PixelSize } from '../../../domain/scenario/ScenarioImageFrame.ts';
import { jsonPost } from '../text/textApi.ts';
import { inlineImage, type ImageApi } from './imageApi.ts';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';

// The image comes as an inline part, beside text parts; a blocked prompt has no candidates.
const PART = z.object({ inlineData: z.object({ mimeType: z.string(), data: z.string() }).optional() });
const ANSWER = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(PART).optional() }).optional() })).optional() });

// The aspect ratios the image models make: the nearest one to the size (9:16 and 16:9 for the videos).
const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] as const;
const ratioOf = (text: string): number => {
  const [width, height] = text.split(':').map(Number);
  return width! / height!;
};
const distance = (text: string, size: PixelSize): number => Math.abs(Math.log(ratioOf(text) / (size.width / size.height)));

function aspectRatioOf(size: PixelSize): string {
  return ASPECT_RATIOS.reduce((best, text) => (distance(text, size) < distance(best, size) ? text : best));
}

// Gemini sizes by aspect and resolution class (1K, 2K, 4K), not by pixels.
function body(request: ImageRequest) {
  const seed = request.seed === undefined ? {} : { seed: request.seed };
  const imageConfig = { aspectRatio: aspectRatioOf(request.size), imageSize: imageTierOf(request.size) };
  return { contents: [{ role: 'user', parts: [{ text: request.prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig, ...seed } };
}

const partsOf = (json: unknown) => ANSWER.parse(json).candidates?.[0]?.content?.parts ?? [];

/** Google Gemini image models (Nano Banana), generateContent; the key goes in a header, never in the URL. */
export const GEMINI_IMAGE_API: ImageApi = {
  provider: 'gemini',
  label: 'Google Gemini',
  defaultModel: 'gemini-nano-banana-2.1',
  downloadHosts: [],
  call: (model, request, key) => jsonPost(`${API}/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key }, body(request)),
  image: (json) => {
    const inline = partsOf(json).find((part) => part.inlineData)?.inlineData;
    return inline ? inlineImage(inline.data, inline.mimeType) : undefined;
  },
};
