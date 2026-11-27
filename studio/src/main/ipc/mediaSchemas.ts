import { z } from 'zod';
import { CAST_VOICE_PROVIDERS, QWEN_MODELS, type CharacterFile } from '../../shared/cast.ts';
import type { ChannelName, RequestOf } from '../../shared/contract.ts';
import { IMAGE_STYLES, MAXIMUM_IMAGE_BYTES, SCENE_IMAGE_PROVIDERS } from '../../shared/scenarios.ts';
import { MAXIMUM_RECORDING_BYTES } from '../../shared/voices.ts';
import { translate } from '../text.ts';

const nothing = z.object({}).strict();
const folder = z.string().trim().min(1, { error: () => translate('errors.emptyFolder') });
// An id names a file (cast/<id>.json, scenes/<id>.png, recordings/<id>.wav): a plain name, never a path.
const plainId = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/i, { error: () => translate('media.plainId') }).max(64);
const shortText = (most: number) => z.string().max(most);
const bytes = (most: number) => z.instanceof(Uint8Array).refine((data) => data.byteLength <= most, { error: () => translate('media.tooBig', { most: Math.round(most / 1024 / 1024) }) });
const line = { folder, lineId: plainId };

// Only the shape and the sizes: core's rig catalog checks the rig and every parameter (and says what is wrong).
const character = z.object({
  id: plainId,
  name: shortText(120),
  rig: shortText(64).optional(),
  parameters: z.record(z.string().max(64), z.union([z.string().max(64), z.number(), z.boolean()])),
  voice: z.object({ id: shortText(200), style: shortText(600).optional() }).strict(),
  personality: shortText(1000).optional(),
  defaultExpression: shortText(64),
}).strict() as unknown as z.ZodType<CharacterFile>;

type MediaChannel = Extract<ChannelName, `cast.${string}` | `scenarios.${string}` | `voices.${string}`>;

/** The Cast, Scenarios and Voices channels' payloads: nothing the window sends is used before this. */
export const MEDIA_SCHEMAS: { readonly [Name in MediaChannel]: z.ZodType<RequestOf<Name>> } = {
  'cast.catalog': nothing,
  'cast.read': z.object({ folder }).strict(),
  'cast.check': z.object({ character }).strict(),
  'cast.save': z.object({ folder, character }).strict(),
  'cast.add': z.object({ folder, preset: plainId.optional(), id: plainId.optional(), name: shortText(120).optional() }).strict(),
  'cast.remove': z.object({ folder, id: plainId }).strict(),
  'cast.voice': z.object({ folder, voice: z.object({ provider: z.enum(CAST_VOICE_PROVIDERS), model: z.enum(QWEN_MODELS).optional() }).strict() }).strict(),
  'cast.sample': z.object({ folder, voice: z.object({ id: z.string().trim().min(1).max(200), style: shortText(600).optional() }).strict(), text: z.string().trim().min(1).max(300) }).strict(),
  'scenarios.read': z.object({ folder }).strict(),
  'scenarios.vector': z.object({ ...line, vector: plainId }).strict(),
  'scenarios.upload': z.object({ ...line, bytes: bytes(MAXIMUM_IMAGE_BYTES) }).strict(),
  'scenarios.prompt': z.object({ ...line, prompt: z.string().trim().min(1, { error: () => translate('errors.emptyText') }).max(2000), style: z.enum(IMAGE_STYLES).optional() }).strict(),
  'scenarios.estimate': z.object({ ...line, force: z.boolean() }).strict(),
  'scenarios.generate': z.object({ ...line, force: z.boolean() }).strict(),
  'scenarios.cancel': nothing,
  'scenarios.useGenerated': z.object(line).strict(),
  'scenarios.settings': z.object({ folder, style: z.enum(IMAGE_STYLES).optional(), provider: z.enum(SCENE_IMAGE_PROVIDERS).optional() }).strict(),
  'voices.read': z.object({ folder }).strict(),
  'voices.generate': z.object({ folder, lineId: plainId.optional() }).strict(),
  'voices.cancel': nothing,
  'voices.record': z.object({ ...line, wav: bytes(MAXIMUM_RECORDING_BYTES) }).strict(),
  'voices.unrecord': z.object(line).strict(),
};
