// Part of the composition point (see composition.ts): what a cast editor offers and checks (the Studio's cast stage),
// and the voice sample ("ouvir amostra") of a character being made.
import type { Problem } from '../../../application/ports/ProjectError.ts';
import type { VoiceProvider } from '../../../application/ports/VoiceProvider.ts';
import { SpeakSample, type SampleRequest } from '../../../application/use-cases/SpeakSample.ts';
import { defaultVoiceStyle } from '../../../domain/cast/voiceStyles.ts';
import { VOICE_MODELS, VOICE_PROVIDERS, type VoiceProviderName } from '../../../domain/project/Project.ts';
import { Language } from '../../../domain/values/Language.ts';
import { EspeakPhonemizer } from '../../../infrastructure/phonetics/EspeakPhonemizer.ts';
import { characterProblems } from '../../../infrastructure/schema/characterCheck.ts';
import { ElevenLabsVoice } from '../../../infrastructure/voice/external/ElevenLabsVoice.ts';
import { externalSettings } from '../../../infrastructure/voice/external/externalSettings.ts';
import { FishVoice } from '../../../infrastructure/voice/external/FishVoice.ts';
import { LazyVoice } from '../../../infrastructure/voice/LazyVoice.ts';
import { QWEN_VOICES, type QwenModel } from '../../../infrastructure/voice/qwen/qwenModels.ts';
import { toWav } from '../../../infrastructure/voice/wav.ts';
import { realWait } from '../../../infrastructure/http/serviceRequest.ts';
import { RigCatalogFromRegistry } from '../../rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../../rigs/rigRegistry.ts';
import { installConfig } from './install.ts';
import type { VoiceKeys } from './voices.ts';

const catalog = new RigCatalogFromRegistry(rigRegistry);

/** Every rig with its names and parameter definitions (plain data: the editor draws one control per parameter). */
export function rigCatalog() {
  return rigRegistry.all().map(({ id, name, parameters }) => ({ id, name, parameters }));
}

/** The problems of one character file (schema, rig and every parameter), with readable pt-BR messages; none when valid. */
export function checkCharacter(json: unknown): readonly Problem[] {
  return characterProblems(json, catalog);
}

/** The voices a character can get: the services, the local voice's models and voice ids, the default style per language. */
export function castVoices() {
  const styles = { 'pt-BR': defaultVoiceStyle(Language.PORTUGUESE), en: defaultVoiceStyle(Language.ENGLISH) };
  return { providers: VOICE_PROVIDERS, models: VOICE_MODELS, qwen: QWEN_VOICES, styles };
}

export type SampleVoice = Readonly<{ provider: Exclude<VoiceProviderName, 'recording'>; model?: QwenModel; keys: VoiceKeys }>;

async function qwenVoice(model: QwenModel | undefined) {
  const { QwenVoice } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return new QwenVoice(installConfig(), model);
}

const service = (keys: VoiceKeys, name: 'elevenlabs' | 'fish') => ({ fetch, key: () => keys(name), wait: realWait });

const SAMPLE_VOICES = {
  qwen: ({ model }: SampleVoice) => new LazyVoice(() => qwenVoice(model)),
  elevenlabs: ({ keys }: SampleVoice) => new ElevenLabsVoice(service(keys, 'elevenlabs'), externalSettings(process.env)),
  fish: ({ keys }: SampleVoice) => new FishVoice(service(keys, 'fish'), externalSettings(process.env)),
} as const;

/** A sample speaker: keep it to say several samples (the local voice loads its model once). */
export function voiceSampler(voice: SampleVoice) {
  return voiceSamplerWith(SAMPLE_VOICES[voice.provider](voice));
}

/** The same with any voice (the Studio's rehearsal voice); the WAV is 16-bit mono, as the lines' audio. */
export function voiceSamplerWith(voice: VoiceProvider) {
  const speak = new SpeakSample({ voice, phonemizer: new EspeakPhonemizer() });
  return async (request: SampleRequest) => {
    const { audio, envelope, visemes } = await speak.run(request);
    return { wav: toWav(audio), seconds: audio.duration().value(), envelope, visemes };
  };
}
