import { z } from 'zod';
import type { ImageRequest } from '../../../application/ports/ImageProvider.ts';
import { jsonPost } from '../text/textApi.ts';
import { linkedImage, type ImageApi } from './imageApi.ts';

const RUN = 'https://fal.run';

// A link to the image on fal's storage, or a data URI in sync mode.
const ANSWER = z.object({ images: z.array(z.object({ url: z.string(), content_type: z.string().optional() })) });

// The model id is the endpoint path (fal-ai/flux-2-pro); the size goes as a custom {width, height}.
function body(request: ImageRequest) {
  const seed = request.seed === undefined ? {} : { seed: request.seed };
  return { prompt: request.prompt, image_size: { width: request.size.width, height: request.size.height }, output_format: 'png', ...seed };
}

/** fal.ai (Flux), the synchronous fal.run API. */
export const FAL_IMAGE_API: ImageApi = {
  provider: 'fal',
  label: 'fal.ai',
  defaultModel: 'fal-ai/flux-2-pro',
  call: (model, request, key) => jsonPost(`${RUN}/${model}`, { authorization: `Key ${key}` }, body(request)),
  image: (json) => {
    const first = ANSWER.parse(json).images[0];
    return first ? linkedImage(first.url, first.content_type) : undefined;
  },
};
