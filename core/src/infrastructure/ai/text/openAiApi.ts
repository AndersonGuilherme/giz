import { z } from 'zod';
import type { TextRequest } from '../../../application/ports/TextProvider.ts';
import { jsonPost, maxTokensOf, systemOf, type TextApi } from './textApi.ts';

const URL = 'https://api.openai.com/v1/chat/completions';

// A refusal comes with a null content: the answer is then empty.
const ANSWER = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }), finish_reason: z.string().nullable().optional() })).min(1),
  usage: z.object({ prompt_tokens: z.number(), completion_tokens: z.number() }),
});

// The system instructions go as a developer message (it replaces the system role on current models).
function body(model: string, request: TextRequest) {
  const messages = [{ role: 'developer', content: systemOf(request) }, { role: 'user', content: request.prompt }];
  const format = request.json ? { response_format: { type: 'json_object' } } : {};
  return { model, max_completion_tokens: maxTokensOf(request), messages, ...format };
}

/** OpenAI (GPT), Chat Completions API. */
export const OPENAI_API: TextApi = {
  provider: 'openai',
  label: 'OpenAI',
  defaultModel: 'gpt-6.2-astra',
  // OpenAI caches long prompt prefixes by itself, without markers.
  promptCaching: false,
  call: (model, request, key) => jsonPost(URL, { authorization: `Bearer ${key}` }, body(model, request)),
  answer: (json) => {
    const { choices, usage } = ANSWER.parse(json);
    const [choice] = choices;
    const truncated = choice?.finish_reason === 'length';
    return { text: choice?.message.content ?? '', usage: { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens }, truncated };
  },
};
