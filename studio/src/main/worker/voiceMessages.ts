// The messages between the main process and the voice worker, checked with zod on both sides (a worker is another
// process: nothing it sends is used unchecked, and it acts on nothing it was not asked in this shape).
import { z } from 'zod';
import { QWEN_MODELS } from '../../shared/cast.ts';

const id = z.number().int().positive();
const language = z.enum(['pt-BR', 'en']);
const text = (most: number) => z.string().max(most);

const voices = z.object({ type: z.literal('voices'), id, folder: text(4096).min(1), only: text(64).optional(), key: text(400).optional(), language }).strict();
const sampleVoice = z.object({ provider: z.enum(['qwen', 'elevenlabs', 'fish']), model: z.enum(QWEN_MODELS).optional(), key: text(400).optional() }).strict();
const request = z.object({ id: text(200), style: text(600).optional(), text: text(300), language }).strict();
const sample = z.object({ type: z.literal('sample'), id, voice: sampleVoice, request, language }).strict();
const cancel = z.object({ type: z.literal('cancel'), id }).strict();

/** Main → worker: make a project's lines (`only` one, made again), say a sample, or cancel a job. */
export const toVoiceWorker = z.discriminatedUnion('type', [voices, sample, cancel]);
export type ToVoiceWorker = z.infer<typeof toVoiceWorker>;

const wav = z.custom<Uint8Array>((value) => value instanceof Uint8Array);
const spoken = z.object({ wav, seconds: z.number(), envelope: z.array(z.number()).readonly(), visemes: z.string() }).strict();
const line = z.object({ type: z.literal('line'), id, done: z.number().int(), total: z.number().int(), lineId: text(64) }).strict();
const ended = z.object({ type: z.literal('ended'), id, sample: spoken.optional() }).strict();
/** The longest failure message an answer carries (the worker cuts a longer one). */
export const MOST_MESSAGE = 4000;
const failed = z.object({ type: z.literal('failed'), id, message: text(MOST_MESSAGE) }).strict();

/** Worker → main: a line done, the job's end (a sample's audio with it), or its failure; each job ends exactly once. */
export const fromVoiceWorker = z.discriminatedUnion('type', [line, ended, failed]);
export type FromVoiceWorker = z.infer<typeof fromVoiceWorker>;

/** Set to `1` in the worker's environment in rehearsal mode: it speaks with the rehearsal voice (no model). */
export const VOICE_REHEARSAL_VARIABLE = 'GIZ_VOICE_REHEARSAL';
