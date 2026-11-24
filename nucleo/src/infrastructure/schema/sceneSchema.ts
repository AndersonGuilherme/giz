import { z } from 'zod';
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

const backgroundSchema = z
  .object({
    image: nonEmptyText.optional(),
    vector: nonEmptyText.optional(),
    colors: z.record(colorSchema).optional(),
  })
  .strict();

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
