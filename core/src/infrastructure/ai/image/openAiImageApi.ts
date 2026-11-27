import { z } from 'zod';
import type { ImageRequest } from '../../../application/ports/ImageProvider.ts';
import type { PixelSize } from '../../../domain/scenario/ScenarioImageFrame.ts';
import { jsonPost } from '../text/textApi.ts';
import { inlineImage, type ImageApi } from './imageApi.ts';

const URL = 'https://api.openai.com/v1/images/generations';

// GPT Image answers in base64 (it has no URL answers); `data` is missing when nothing was made.
const ANSWER = z.object({ data: z.array(z.object({ b64_json: z.string().optional() })).optional(), output_format: z.string().optional() });

// The custom sizes of GPT-Image-2.5/2.6: sides in multiples of 16, at most 3840, between 655,360 and 8,294,400 pixels.
const LIMITS = { minimumPixels: 655_360, maximumPixels: 8_294_400, maximumSide: 3840, grid: 16 };

// Scaled (same aspect) into the limits: rounded up when it grows, down when it shrinks, so it stays inside them.
function sizeOf({ width, height }: PixelSize): string {
  const area = width * height;
  const grow = Math.sqrt(LIMITS.minimumPixels / area);
  const shrink = Math.min(Math.sqrt(LIMITS.maximumPixels / area), LIMITS.maximumSide / Math.max(width, height), 1);
  const scale = Math.max(grow, shrink);
  const round = scale > 1 ? Math.ceil : Math.floor;
  const side = (pixels: number) => round((pixels * scale) / LIMITS.grid) * LIMITS.grid;
  return `${side(width)}x${side(height)}`;
}

// Medium quality: an explicit setting, so the estimate matches what is billed (`auto` varies). One image is the
// default count; no seed field exists.
function body(model: string, request: ImageRequest) {
  return { model, prompt: request.prompt, size: sizeOf(request.size), quality: 'medium', output_format: 'png' };
}

/** OpenAI (GPT Image), Images API. */
export const OPENAI_IMAGE_API: ImageApi = {
  provider: 'openai',
  label: 'OpenAI',
  defaultModel: 'gpt-image-2.6-sunburst',
  downloadHosts: [],
  call: (model, request, key) => jsonPost(URL, { authorization: `Bearer ${key}` }, body(model, request)),
  image: (json) => {
    const { data, output_format: format = 'png' } = ANSWER.parse(json);
    const base64 = data?.[0]?.b64_json;
    return base64 ? inlineImage(base64, `image/${format}`) : undefined;
  },
};
