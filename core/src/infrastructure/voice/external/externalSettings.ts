import type { Pauses } from './sentencePauses.ts';

export type ExternalSettings = Readonly<{ elevenLabsModel: string; fishModel: string; pauses: Pauses }>;
type Environment = Readonly<Record<string, string | undefined>>;
type Warn = (message: string) => void;

// Measured in the motor: the voice adds ~0.3 s of its own, so 0.15 s gives ~450 ms between sentences; with the
// sentence end guaranteed, the voice already pauses ~160–260 ms at commas.
const DEFAULT_SENTENCE_PAUSE = 0.15;
const DEFAULT_COMMA_PAUSE = 0;

// The GIZ_* name, then the motor name, then the default.
const textOf = (env: Environment, [name, motorName]: readonly [string, string], fallback: string) => env[name] ?? env[motorName] ?? fallback;

// A pause that is not a number of seconds keeps the default, with a warning.
function secondsOf(text: string, fallback: number, source: Readonly<{ name: string; warn: Warn }>): number {
  const seconds = Number(text);
  if (text.trim() !== '' && Number.isFinite(seconds) && seconds >= 0) return seconds;
  source.warn(`${source.name}="${text}" não é um número de segundos; usando ${fallback}`);
  return fallback;
}

const pauseOf = (env: Environment, names: readonly [string, string], context: Readonly<{ fallback: number; warn: Warn }>) =>
  secondsOf(textOf(env, names, String(context.fallback)), context.fallback, { name: names[0], warn: context.warn });

/** The voice service settings from the environment (GIZ_* names; the motor names still work). */
export function externalSettings(env: Environment, warn: Warn = (message) => console.warn(`AVISO: ${message}`)): ExternalSettings {
  return {
    elevenLabsModel: textOf(env, ['GIZ_ELEVENLABS_MODEL', 'ELEVEN_MODEL'], 'eleven_multilingual_v2'),
    fishModel: textOf(env, ['GIZ_FISH_MODEL', 'FISH_MODEL'], 's1'),
    pauses: {
      sentence: pauseOf(env, ['GIZ_SENTENCE_PAUSE', 'PAUSA_PONTO'], { fallback: DEFAULT_SENTENCE_PAUSE, warn }),
      comma: pauseOf(env, ['GIZ_COMMA_PAUSE', 'PAUSA_VIRGULA'], { fallback: DEFAULT_COMMA_PAUSE, warn }),
    },
  };
}
