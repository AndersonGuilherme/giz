import { z } from 'zod';
import { ASPECTS } from '../../shared/contract.ts';
import { FORMATS, IDEA_LIMITS } from '../../shared/projects.ts';
import type { ScriptJson } from '../../shared/script.ts';
import { INTERFACE_LANGUAGES } from '../../shared/settings.ts';
import { translate } from '../text.ts';

const text = (most: number) => z.string().trim().min(1, { error: () => translate('errors.emptyText') }).max(most);
// A preset id or a scene name: a plain name (it names files), never a path.
const plainName = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/i).max(64);

/** The idea the wizard sends: the same limits as core's Idea (which checks it again). */
export const IDEA_REQUEST = z.object({
  idea: z.object({
    format: z.enum(FORMATS),
    aspect: z.enum(ASPECTS),
    targetSeconds: z.number().int().min(IDEA_LIMITS.seconds.min).max(IDEA_LIMITS.seconds.max),
    theme: text(IDEA_LIMITS.theme),
    audience: text(IDEA_LIMITS.short),
    tone: text(IDEA_LIMITS.short),
    language: z.enum(INTERFACE_LANGUAGES),
    cast: z.array(plainName).max(12).optional(),
    scenes: z.array(plainName).max(12).optional(),
  }).strict(),
}).strict();

// The lines go to core as they are (core's schema says what is wrong with them, field by field): here only the shape
// and the size are checked, so a script in the middle of an edit can always be saved.
const script = z.object({
  chapters: z.array(z.string().max(500)).max(500),
  lines: z.array(z.record(z.string(), z.unknown())).max(5000),
}).strict();
export const SCRIPT_REQUEST = script as unknown as z.ZodType<ScriptJson>;

/** One scene checked alone (the scene editor, as the person types). */
export const SCENE_REQUEST = z.object({ scene: z.unknown() }).strict();
