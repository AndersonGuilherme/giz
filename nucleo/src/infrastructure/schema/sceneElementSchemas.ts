import { z } from 'zod';
import {
  TEXT_ENTRANCES,
  EASINGS,
  EFFECT_TYPES,
  MOVE_TYPES,
} from '../../domain/script/SceneElements.ts';
import { MAXIMUM_INTENSITY } from '../../domain/scenario/EffectStrength.ts';
import { colorSchema, nonEmptyText } from './refinements.ts';

export const pointSchema = z.object({ x: z.number(), y: z.number() }).strict();

const framingSchema = z.object({ x: z.number(), y: z.number(), zoom: z.number().positive() }).strict();

export const cameraSchema = z
  .object({
    type: z.enum(MOVE_TYPES),
    from: framingSchema.optional(),
    to: framingSchema.optional(),
    target: nonEmptyText.optional(),
    intensity: z.number().min(0).optional(),
    easing: z.enum(EASINGS).optional(),
  })
  .strict();

export const effectSchema = z
  .object({
    type: z.enum(EFFECT_TYPES),
    intensity: z.number().min(0).max(MAXIMUM_INTENSITY).optional(),
    color: colorSchema.optional(),
    position: pointSchema.optional(),
  })
  .strict();

export const hudSchema = z
  .object({
    fields: z.array(z.object({ label: z.string(), value: z.string() }).strict()),
    bar: z.object({ label: z.string(), value: z.number().min(0).max(100) }).strict().optional(),
  })
  .strict();

export const bigTextSchema = z
  .object({ text: nonEmptyText, color: colorSchema.optional(), entrance: z.enum(TEXT_ENTRANCES).optional() })
  .strict();
