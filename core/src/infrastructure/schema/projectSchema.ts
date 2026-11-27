import { z } from 'zod';
import { CAPTION_STYLES, FORMATS, VOICE_MODELS, VOICE_PROVIDERS } from '../../domain/project/Project.ts';
import { IMAGE_PROVIDERS } from '../../domain/ai/ImageProviderName.ts';
import { IMAGE_STYLES } from '../../domain/scenario/ImageStyle.ts';
import { Language } from '../../domain/values/Language.ts';
import { AspectRatio } from '../../domain/values/AspectRatio.ts';
import { characterIdSchema, nonEmptyText, validatedByDomain } from './refinements.ts';

export const projectSchema = z
  .object({
    version: z.literal(2),
    title: nonEmptyText,
    format: z.enum(FORMATS),
    language: validatedByDomain((text) => Language.of(text)),
    aspect: validatedByDomain((text) => AspectRatio.of(text)),
    brand: nonEmptyText.optional(),
    captionStyle: z.enum(CAPTION_STYLES).optional(),
    cast: z.array(characterIdSchema).min(1),
    voice: z.object({ provider: z.enum(VOICE_PROVIDERS), model: z.enum(VOICE_MODELS).optional() }).strict(),
    // The look of the AI-generated scenarios and the image AI that makes them (both optional).
    style: z.enum(IMAGE_STYLES).optional(),
    imageProvider: z.enum(IMAGE_PROVIDERS).optional(),
  })
  .strict();

export type ProjectJson = z.infer<typeof projectSchema>;
