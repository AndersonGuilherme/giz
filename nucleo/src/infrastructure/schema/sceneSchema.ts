import { z } from 'zod';
import { BackgroundPalette } from '../../domain/scenario/BackgroundPalette.ts';
import { VECTOR_BACKGROUNDS, type VectorBackground } from '../../domain/scenario/BackgroundSource.ts';
import { DIRECTIONS, NAMED_POSITIONS, type Scene } from '../../domain/script/Scene.ts';
import { lessonSceneSchemas } from './lessonSceneSchemas.ts';
import {
  cameraSchema,
  effectSchema,
  pointSchema,
  bigTextSchema,
  hudSchema,
} from './sceneElementSchemas.ts';
import { colorSchema, characterIdSchema, nonEmptyText } from './refinements.ts';

const characterInSceneSchema = z
  .object({
    character: characterIdSchema,
    position: z.union([z.enum(NAMED_POSITIONS), pointSchema]),
    scale: z.number().positive().optional(),
    direction: z.enum(DIRECTIONS).optional(),
  })
  .strict();

const isVector = (name: string | undefined): name is VectorBackground => VECTOR_BACKGROUNDS.some((known) => known === name);

type BackgroundJson = Readonly<{ vector?: string; colors?: Readonly<Record<string, string>> }>;

// A color key the background does not have would silently do nothing: it is an error naming the valid keys.
function rejectUnknownColors({ vector, colors }: BackgroundJson, context: z.RefinementCtx): void {
  if (!colors || !isVector(vector)) return;
  const valid = BackgroundPalette.keys(vector).join(', ');
  BackgroundPalette.unknownKeys(vector, colors).forEach((key) =>
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['colors', key], message: `cor desconhecida no fundo "${vector}" (use ${valid})` }));
}

const backgroundSchema = z
  .object({
    image: nonEmptyText.optional(),
    vector: nonEmptyText.optional(),
    colors: z.record(colorSchema).optional(),
  })
  .strict()
  .superRefine(rejectUnknownColors);

const scenarioSchema = z
  .object({
    type: z.literal('scenario'),
    background: backgroundSchema,
    characters: z.array(characterInSceneSchema),
    camera: cameraSchema.optional(),
    effects: z.array(effectSchema).optional(),
    hud: hudSchema.optional(),
    highlight: bigTextSchema.optional(),
  })
  .strict();

export const sceneSchema: z.ZodType<Scene, z.ZodTypeDef, unknown> = z.discriminatedUnion('type', [
  scenarioSchema,
  ...lessonSceneSchemas,
]);
