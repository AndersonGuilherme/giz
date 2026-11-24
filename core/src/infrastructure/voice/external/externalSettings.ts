import type { Pauses } from './sentencePauses.ts';

export type ExternalSettings = Readonly<{ elevenLabsModel: string; fishModel: string; pauses: Pauses }>;
type Environment = Readonly<Record<string, string | undefined>>;

// Measured in the motor: the voice adds ~0.3 s of its own, so 0.15 s gives ~450 ms between sentences; with the
// sentence end guaranteed, the voice already pauses ~160–260 ms at commas.
const DEFAULT_SENTENCE_PAUSE = 0.15;
const DEFAULT_COMMA_PAUSE = 0;

// The GIZ_* name, then the motor name, then the default.
const textOf = (env: Environment, [name, motorName]: readonly [string, string], fallback: string) => env[name] ?? env[motorName] ?? fallback;

/** The voice service settings from the environment (GIZ_* names; the motor names still work). */
export function externalSettings(env: Environment): ExternalSettings {
  return {
    elevenLabsModel: textOf(env, ['GIZ_ELEVENLABS_MODEL', 'ELEVEN_MODEL'], 'eleven_multilingual_v2'),
    fishModel: textOf(env, ['GIZ_FISH_MODEL', 'FISH_MODEL'], 's1'),
    pauses: {
      sentence: Number(textOf(env, ['GIZ_SENTENCE_PAUSE', 'PAUSA_PONTO'], String(DEFAULT_SENTENCE_PAUSE))),
      comma: Number(textOf(env, ['GIZ_COMMA_PAUSE', 'PAUSA_VIRGULA'], String(DEFAULT_COMMA_PAUSE))),
    },
  };
}
