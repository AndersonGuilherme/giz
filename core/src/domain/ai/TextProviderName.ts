/** The text AI services Gizzycera can call. */
export const TEXT_PROVIDERS = ['anthropic', 'openai', 'gemini'] as const;
export type TextProviderName = (typeof TEXT_PROVIDERS)[number];

export function isTextProvider(name: string | undefined): name is TextProviderName {
  return (TEXT_PROVIDERS as readonly string[]).includes(name ?? '');
}
