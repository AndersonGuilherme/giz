// Part of the composition point (see composition.ts): the Studio's voice worker keeps one workshop for its whole life,
// so the local voice (one per model size) and Whisper load once and serve every line made and every sample said.
import type { VoiceProvider } from '../../../application/ports/VoiceProvider.ts';
import type { Project } from '../../../domain/project/Project.ts';
import type { Listener } from '../../../infrastructure/alignment/WhisperAligner.ts';
import { whisperDownloaded } from '../../../infrastructure/alignment/whisperDownload.ts';
import { WhisperListener } from '../../../infrastructure/alignment/WhisperListener.ts';
import { LazyVoice } from '../../../infrastructure/voice/LazyVoice.ts';
import type { QwenModel } from '../../../infrastructure/voice/qwen/qwenModels.ts';
import { generateVoicesWith, type StudioVoices } from '../composition.ts';
import { voiceSampler, voiceSamplerWith, type SampleVoice } from './casting.ts';
import { installConfig } from './install.ts';

/**
 * `qwen`, `listener`, `configured` and `whisperReady`: other makers (tests); by default the real local voice and
 * Whisper, each loaded on first use, the model size of gizzycera.config.json and whether Whisper is downloaded.
 */
export type WorkshopParts = Readonly<{ qwen?: (model: QwenModel) => VoiceProvider; listener?: Listener; configured?: () => QwenModel; whisperReady?: () => boolean }>;

type Install = Parameters<typeof import('../../../infrastructure/voice/QwenVoice.ts').loadQwen>[0];

// The Studio never downloads a model while making voices: only a model already downloaded (Settings) is opened.
async function qwenVoice(model: QwenModel, install: Install): Promise<VoiceProvider> {
  const { QwenVoice, loadDownloadedQwen } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return new QwenVoice(install, model, loadDownloadedQwen);
}

/**
 * The local voice of one model size, loaded on its first line; a load that fails (a model not downloaded yet) is
 * tried again on the next line: LazyVoice keeps only a load that worked.
 */
export const localQwen = (model: QwenModel, install: Install = installConfig()): VoiceProvider => new LazyVoice(() => qwenVoice(model, install));
const realQwen = (model: QwenModel): VoiceProvider => localQwen(model);
const configuredModel = (): QwenModel => installConfig().model;
// Whisper is never downloaded while making voices either: without it the words are aligned by the voice's envelope,
// with the same warning as when Whisper cannot load (offline).
const notDownloaded: Listener = { listen: async () => { throw new Error('o Whisper não foi baixado: baixe-o em Configurações'); } };

/** Lines (`lines`, as generateVoicesWith) and samples (`sampler`, as voiceSampler) sharing the loaded models. */
export function voiceWorkshop({ qwen = realQwen, listener = new WhisperListener(), configured = configuredModel, whisperReady = whisperDownloaded }: WorkshopParts = {}) {
  const local = new Map<QwenModel, VoiceProvider>();
  // One voice per real size: no model named is the size gizzycera.config.json names (read once per process, like the CLI).
  const localVoice = (named: QwenModel | undefined): VoiceProvider => {
    const model = named ?? configured();
    const voice = local.get(model) ?? qwen(model);
    local.set(model, voice);
    return voice;
  };
  return {
    lines(folder: string, project: Project, options: Omit<StudioVoices, 'listener'>) {
      const { provider, model } = project.voice();
      const voice = options.voice ?? (provider === 'qwen' ? localVoice(model) : undefined);
      return generateVoicesWith(folder, project, { ...options, voice, listener: whisperReady() ? listener : notDownloaded });
    },
    sampler(voice: SampleVoice) {
      return voice.provider === 'qwen' ? voiceSamplerWith(localVoice(voice.model)) : voiceSampler(voice);
    },
  };
}
