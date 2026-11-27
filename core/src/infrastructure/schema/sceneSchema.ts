import { z } from 'zod';
import { BackgroundPalette } from '../../domain/scenario/BackgroundPalette.ts';
import { BackgroundSource } from '../../domain/scenario/BackgroundSource.ts';
import { IMAGE_STYLES } from '../../domain/scenario/ImageStyle.ts';
import { ImageCrop } from '../../domain/scenario/ImageCrop.ts';
import { ProjectPath } from '../../domain/values/ProjectPath.ts';
import { DIRECTIONS, NAMED_POSITIONS, type Scene } from '../../domain/script/Scene.ts';
import { lessonSceneSchemas } from './lessonSceneSchemas.ts';
import {
  cameraSchema,
  effectSchema,
  pointSchema,
  bigTextSchema,
  hudSchema,
} from './sceneElementSchemas.ts';
import { colorSchema, characterIdSchema, domainMessage, nonEmptyText, validatedByDomain } from './refinements.ts';

const characterInSceneSchema = z
  .object({
    character: characterIdSchema,
    position: z.union([z.enum(NAMED_POSITIONS), pointSchema]),
    scale: z.number().positive().optional(),
    direction: z.enum(DIRECTIONS).optional(),
  })
  .strict();

type BackgroundJson = Readonly<{ vector?: string; colors?: Readonly<Record<string, string>> }>;

// A color key the background does not have would silently do nothing: it is an error naming the valid keys. Without a
// known `vector` the colors go to the background actually drawn (the `room` fallback), so they are checked against it.
function rejectUnknownColors(background: BackgroundJson, context: z.RefinementCtx): void {
  const { colors } = background;
  if (!colors) return;
  const vector = BackgroundSource.vectorFor(background.vector);
  const valid = BackgroundPalette.keys(vector).join(', ');
  BackgroundPalette.unknownKeys(vector, colors).forEach((key) =>
    context.addIssue({ code: 'custom', path: ['colors', key], message: `cor desconhecida no fundo "${vector}" (use ${valid})` }));
}

// The crop's shape here; its ranges are the domain's (ImageCrop), with its readable message.
const cropSchema = z
  .object({ zoom: z.number(), x: z.number(), y: z.number() })
  .strict()
  .superRefine((crop, context) => {
    const message = domainMessage(() => ImageCrop.of(crop));
    if (message) context.addIssue({ code: 'custom', message });
  });

const backgroundFields = {
  // Relative to the project folder and inside it: the render serves it from there.
  image: nonEmptyText.pipe(validatedByDomain((text) => ProjectPath.of(text))).optional(),
  vector: nonEmptyText.optional(),
  colors: z.record(z.string(), colorSchema).optional(),
  crop: cropSchema.optional(),
};

/** The background a beat switches to: an image or a vector background (images are generated per scene only). */
export const backgroundSchema = z.object(backgroundFields).strict().superRefine(rejectUnknownColors);

// `giz images` makes the image from the prompt; `style` overrides the project's `style` for this scene.
const generateSchema = z.object({ prompt: nonEmptyText, style: z.enum(IMAGE_STYLES).optional() }).strict();

const sceneBackgroundSchema = z
  .object({ ...backgroundFields, generate: generateSchema.optional() })
  .strict()
  .superRefine(rejectUnknownColors);

const scenarioSchema = z
  .object({
    type: z.literal('scenario'),
    background: sceneBackgroundSchema,
    characters: z.array(characterInSceneSchema),
    camera: cameraSchema.optional(),
    effects: z.array(effectSchema).optional(),
    hud: hudSchema.optional(),
    highlight: bigTextSchema.optional(),
  })
  .strict();

export const sceneSchema: z.ZodType<Scene, unknown> = z.discriminatedUnion('type', [
  scenarioSchema,
  ...lessonSceneSchemas,
]);
