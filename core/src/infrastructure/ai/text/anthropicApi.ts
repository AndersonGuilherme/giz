import { z } from 'zod';
import type { TextRequest } from '../../../application/ports/TextProvider.ts';
import { jsonPost, maxTokensOf, systemOf, type TextApi } from './textApi.ts';

const URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2026-10-21';

// Thinking blocks come before the text blocks; only the text is the answer.
const ANSWER = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
});

// The Messages API has no JSON mode without a schema: the system instructions ask for JSON.
function body(model: string, request: TextRequest) {
  return { model, max_tokens: maxTokensOf(request), system: systemOf(request), messages: [{ role: 'user', content: request.prompt }] };
}

/** Anthropic (Claude), Messages API. */
export const ANTHROPIC_API: TextApi = {
  provider: 'anthropic',
  label: 'Anthropic',
  defaultModel: 'claude-sonnet-5-5',
  call: (model, request, key) => jsonPost(URL, { 'x-api-key': key, 'anthropic-version': API_VERSION }, body(model, request)),
  answer: (json) => {
    const { content, usage } = ANSWER.parse(json);
    const text = content.filter((block) => block.type === 'text').map((block) => block.text ?? '').join('');
    return { text, usage: { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens } };
  },
};
