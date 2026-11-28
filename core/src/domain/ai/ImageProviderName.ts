/** The image AI services Gizzycera can call: OpenAI (GPT Image), Google (Gemini image) and fal.ai (Flux). */
export const IMAGE_PROVIDERS = ['openai', 'gemini', 'fal'] as const;
export type ImageProviderName = (typeof IMAGE_PROVIDERS)[number];

export function isImageProvider(name: string | undefined): name is ImageProviderName {
  return (IMAGE_PROVIDERS as readonly string[]).includes(name ?? '');
}
