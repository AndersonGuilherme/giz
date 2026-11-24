import { z } from 'zod';
import { EXPRESSIONS } from '../../domain/cast/PoseAndExpression.ts';
import { characterIdSchema, nonEmptyText } from './refinements.ts';

/**
 * Only the parameter types are checked here; the rig catalog validates each one (see `rigParameters.ts`).
 * `rig` is optional only for the narrator (a voice without a body).
 */
export const characterSchema = z
  .object({
    id: characterIdSchema,
    name: nonEmptyText,
    rig: nonEmptyText.optional(),
    parameters: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
    voice: z.object({ id: nonEmptyText, style: nonEmptyText.optional() }).strict(),
    personality: z.string().optional(),
    defaultExpression: z.enum(EXPRESSIONS),
  })
  .strict();

export type CharacterJson = z.infer<typeof characterSchema>;
