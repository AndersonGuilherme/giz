// Part of the composition point (see composition.ts): the Studio's voice worker keeps one workshop for its whole life,
// so the local voice (one per model size) and Whisper load once and serve every line made and every sample said.
import type { VoiceProvider } from '../../../application/ports/VoiceProvider.ts';
import type { Project } from '../../../domain/project/Project.ts';
import type { Listener } from '../../../infrastructure/alignment/WhisperAligner.ts';
import { WhisperListener } from '../../../infrastructure/alignment/WhisperListener.ts';
import { LazyVoice } from '../../../infrastructure/voice/LazyVoice.ts';
import type { QwenModel } from '../../../infrastructure/voice/qwen/qwenModels.ts';
import { generateVoicesWith, type StudioVoices } from '../composition.ts';
import { voiceSampler, voiceSamplerWith, type SampleVoice } from './casting.ts';
import { installConfig } from './install.ts';

/**
 * `qwen`, `listener` and `configured`: other makers (tests); by default the real local voice and Whisper, each loaded
 * on first use, and the model size of giz.config.json.
 */
export type WorkshopParts = Readonly<{ qwen?: (model: QwenModel) => VoiceProvider; listener?: Listener; configured?: () => QwenModel }>;

async function qwenVoice(model: QwenModel): Promise<VoiceProvider> {
  const { QwenVoice } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return new QwenVoice(installConfig(), model);
}

// A load that fails (a model not downloaded yet) is tried again on the next line: LazyVoice keeps only a load that worked.
const realQwen = (model: QwenModel): VoiceProvider => new LazyVoice(() => qwenVoice(model));
const configuredModel = (): QwenModel => installConfig().model;

/** Lines (`lines`, as generateVoicesWith) and samples (`sampler`, as voiceSampler) sharing the loaded models. */
export function voiceWorkshop({ qwen = realQwen, listener = new WhisperListener(), configured = configuredModel }: WorkshopParts = {}) {
  const local = new Map<QwenModel, VoiceProvider>();
  // One voice per real size: no model named is the size giz.config.json names (read once per process, like the CLI).
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
      return generateVoicesWith(folder, project, { ...options, voice, listener });
    },
    sampler(voice: SampleVoice) {
      return voice.provider === 'qwen' ? voiceSamplerWith(localVoice(voice.model)) : voiceSampler(voice);
    },
  };
}
