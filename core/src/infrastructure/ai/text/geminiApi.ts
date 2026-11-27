import { z } from 'zod';
import type { TextRequest } from '../../../application/ports/TextProvider.ts';
import { jsonPost, maxTokensOf, systemOf, type TextApi } from './textApi.ts';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';

const PART = z.object({ text: z.string().optional(), thought: z.boolean().optional() });
// A blocked prompt has no candidates; the token counts may be missing too.
const ANSWER = z.object({
  candidates: z.array(z.object({ content: z.object({ parts: z.array(PART).optional() }).optional() })).optional(),
  usageMetadata: z.object({
    promptTokenCount: z.number().default(0),
    candidatesTokenCount: z.number().default(0),
    thoughtsTokenCount: z.number().default(0),
  }),
});

function body(request: TextRequest) {
  const format = request.json ? { responseMimeType: 'application/json' } : {};
  return {
    system_instruction: { parts: [{ text: systemOf(request) }] },
    contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
    generationConfig: { maxOutputTokens: maxTokensOf(request), ...format },
  };
}

/** Google Gemini, generateContent; the key goes in a header, never in the URL (URLs end up in error messages). */
export const GEMINI_API: TextApi = {
  provider: 'gemini',
  label: 'Google Gemini',
  defaultModel: 'gemini-3.8-flash',
  call: (model, request, key) => jsonPost(`${API}/${encodeURIComponent(model)}:generateContent`, { 'x-goog-api-key': key }, body(request)),
  answer: (json) => {
    const { candidates, usageMetadata: usage } = ANSWER.parse(json);
    const parts = candidates?.[0]?.content?.parts ?? [];
    const text = parts.filter((part) => !part.thought).map((part) => part.text ?? '').join('');
    // Thinking tokens are billed as output.
    return { text, usage: { inputTokens: usage.promptTokenCount, outputTokens: usage.candidatesTokenCount + usage.thoughtsTokenCount } };
  },
};
