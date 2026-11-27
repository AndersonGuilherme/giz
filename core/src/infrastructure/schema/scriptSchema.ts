import { z } from 'zod';
import { EXPRESSIONS, POSES } from '../../domain/cast/PoseAndExpression.ts';
import { SOUND_EFFECTS, GAZES } from '../../domain/script/Line.ts';
import { backgroundSchema, sceneSchema } from './sceneSchema.ts';
import { LineId } from '../../domain/values/LineId.ts';
import { characterIdSchema, nonEmptyText, validatedByDomain } from './refinements.ts';

const pose = z.enum(POSES);
const expression = z.enum(EXPRESSIONS);
const look = z.enum(GAZES);
const sfx = z.enum(SOUND_EFFECTS);

const reactionSchema = z
  .object({ expression: expression.optional(), pose: pose.optional(), look: look.optional() })
  .strict();

// The other scene fields a beat changes pass through; its background is checked like a scene's (the image path rules).
const beatSchema = z
  .object({ expression: expression.optional(), pose: pose.optional(), sfx: sfx.optional(), background: backgroundSchema.optional() })
  .passthrough();

const holdSchema = z.object({ seconds: z.number().positive(), label: z.string() }).strict();

export const lineSchema = z
  .object({
    // The id names files (voice/<id>.wav): the domain keeps it a plain file name.
    id: validatedByDomain((text) => LineId.of(text)),
    chapter: z.number().int().min(1),
    speaker: characterIdSchema,
    text: nonEmptyText,
    pronunciation: nonEmptyText.optional(),
    pose: pose.optional(),
    expression: expression.optional(),
    look: look.optional(),
    reaction: reactionSchema.optional(),
    scene: sceneSchema.optional(),
    beats: z.array(beatSchema).optional(),
    holdAfter: holdSchema.optional(),
    // The reading hold when the line opens a scene: seconds, or false for none (absent: automatic, for code).
    reading: z.union([z.number().min(0), z.literal(false)]).optional(),
    sfx: sfx.optional(),
  })
  .strict();

export type LineJson = z.infer<typeof lineSchema>;

type RawScript = { chapters: string[]; lines: LineJson[] };

function existingChapters(script: RawScript, context: z.RefinementCtx): void {
  const total = script.chapters.length;
  script.lines.forEach((line, index) => {
    if (line.chapter <= total) return;
    const message = `capítulo ${line.chapter} não existe (há ${total})`;
    context.addIssue({ code: 'custom', path: ['lines', index, 'chapter'], message });
  });
}

function uniqueIds(script: RawScript, context: z.RefinementCtx): void {
  script.lines.forEach((line, index) => {
    if (script.lines.findIndex((other) => other.id === line.id) === index) return;
    context.addIssue({ code: 'custom', path: ['lines', index, 'id'], message: `id "${line.id}" repetido` });
  });
}

export const scriptSchema = z
  .object({ chapters: z.array(nonEmptyText).min(1), lines: z.array(lineSchema).min(1) })
  .strict()
  .superRefine(existingChapters)
  .superRefine(uniqueIds);

export type ScriptJson = z.infer<typeof scriptSchema>;
