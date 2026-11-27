import { z } from 'zod';
import type { TextRequest } from '../../../application/ports/TextProvider.ts';
import { jsonPost, maxTokensOf, systemOf, type TextApi } from './textApi.ts';

const URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2026-10-21';

// Thinking blocks come before the text blocks; only the text is the answer. With caching, `input_tokens` is only the
// uncached rest: the cache writes and reads are input tokens too.
const ANSWER = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
  stop_reason: z.string().nullable().optional(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    cache_creation_input_tokens: z.number().nullable().optional(),
    cache_read_input_tokens: z.number().nullable().optional(),
  }),
});

// The stable prefix ends with a cache marker (5-minute entry): the system and that prefix are read back on a repair.
function userContent(request: TextRequest) {
  const { prompt, stablePrefix } = request;
  if (!stablePrefix) return prompt;
  const rest = prompt.slice(stablePrefix);
  const cached = { type: 'text', text: prompt.slice(0, stablePrefix), cache_control: { type: 'ephemeral' } };
  return rest ? [cached, { type: 'text', text: rest }] : [cached];
}

// The Messages API has no JSON mode without a schema: the system instructions ask for JSON.
function body(model: string, request: TextRequest) {
  return { model, max_tokens: maxTokensOf(request), system: systemOf(request), messages: [{ role: 'user', content: userContent(request) }] };
}

/** Anthropic (Claude), Messages API. */
export const ANTHROPIC_API: TextApi = {
  provider: 'anthropic',
  label: 'Anthropic',
  defaultModel: 'claude-sonnet-5-5',
  promptCaching: true,
  call: (model, request, key) => jsonPost(URL, { 'x-api-key': key, 'anthropic-version': API_VERSION }, body(model, request)),
  answer: (json) => {
    const { content, usage, stop_reason: stop } = ANSWER.parse(json);
    const text = content.filter((block) => block.type === 'text').map((block) => block.text ?? '').join('');
    const inputTokens = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
    return { text, usage: { inputTokens, outputTokens: usage.output_tokens }, truncated: stop === 'max_tokens' };
  },
};
