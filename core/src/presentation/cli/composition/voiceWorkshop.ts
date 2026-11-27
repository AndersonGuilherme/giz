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

/** `qwen` and `listener`: other makers (tests); by default the real local voice and Whisper, each loaded on first use. */
export type WorkshopParts = Readonly<{ qwen?: (model: QwenModel | undefined) => VoiceProvider; listener?: Listener }>;

async function qwenVoice(model: QwenModel | undefined): Promise<VoiceProvider> {
  const { QwenVoice } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return new QwenVoice(installConfig(), model);
}

const realQwen = (model: QwenModel | undefined): VoiceProvider => new LazyVoice(() => qwenVoice(model));

/** Lines (`lines`, as generateVoicesWith) and samples (`sampler`, as voiceSampler) sharing the loaded models. */
export function voiceWorkshop({ qwen = realQwen, listener = new WhisperListener() }: WorkshopParts = {}) {
  const local = new Map<string, VoiceProvider>();
  // No model named: the one in giz.config.json (read once per process, like the CLI).
  const localVoice = (model: QwenModel | undefined): VoiceProvider => {
    const name = model ?? 'configured';
    const voice = local.get(name) ?? qwen(model);
    local.set(name, voice);
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
