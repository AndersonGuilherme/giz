import { z } from 'zod';
import { CAPTION_STYLES } from '../../../domain/project/Project.ts';
import { characterSchema } from '../../schema/characterSchema.ts';
import { characterIdSchema, nonEmptyText } from '../../schema/refinements.ts';
import { scriptSchema } from '../../schema/scriptSchema.ts';

/**
 * The answer the text AI gives, built from the real schemas: the project fields the AI chooses, the cast (a preset id
 * or a whole character) and the script. Only its JSON schema is sent; the answer itself is validated by loading it.
 */
export const answerSchema = z
  .object({
    project: z.object({ title: nonEmptyText, captionStyle: z.enum(CAPTION_STYLES).optional() }).strict(),
    cast: z.array(z.union([characterIdSchema, characterSchema])).min(1),
    script: scriptSchema,
  })
  .strict();

// Noise for a reader: the meta-schema URL and the "safe integer" bound zod puts on every integer.
const DROPPED: Readonly<Record<string, unknown>> = { $schema: undefined, maximum: Number.MAX_SAFE_INTEGER };

const dropped = ([key, value]: [string, unknown]) => Object.hasOwn(DROPPED, key) && (DROPPED[key] === undefined || DROPPED[key] === value);

function compact(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(compact);
  if (typeof node !== 'object' || node === null) return node;
  return Object.fromEntries(Object.entries(node).filter((entry) => !dropped(entry)).map(([key, value]) => [key, compact(value)]));
}

/** The JSON schema of the answer, compact (one line): the reference the prompt carries. */
export function answerReference(): string {
  return JSON.stringify(compact(z.toJSONSchema(answerSchema, { unrepresentable: 'any', io: 'input' })));
}
