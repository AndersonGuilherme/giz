// Part of the composition point (see composition.ts): one voice adapter per `voice.provider`.
import { homedir } from 'node:os';
import type { VoiceProvider } from '../../../application/ports/VoiceProvider.ts';
import type { Project, VoiceProviderName } from '../../../domain/project/Project.ts';
import { apiKeyOf, type ExternalService } from '../../../infrastructure/voice/external/apiKey.ts';
import { ElevenLabsVoice } from '../../../infrastructure/voice/external/ElevenLabsVoice.ts';
import { externalSettings } from '../../../infrastructure/voice/external/externalSettings.ts';
import { FishVoice } from '../../../infrastructure/voice/external/FishVoice.ts';
import type { ServiceDependencies } from '../../../infrastructure/voice/external/serviceRequest.ts';
import { realWait } from '../../../infrastructure/http/serviceRequest.ts';
import { LazyVoice } from '../../../infrastructure/voice/LazyVoice.ts';
import { RecordingVoice } from '../../../infrastructure/voice/RecordingVoice.ts';
import { installConfig } from './install.ts';

// QwenVoice loads onnxruntime-node (and the model): it is imported only when a line is generated, so check, build,
// render and sheet start fast and never touch the GPU.
async function qwenVoice(project: Project): Promise<VoiceProvider> {
  const { QwenVoice } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return new QwenVoice(installConfig(), project.voice().model);
}

// The key is read only when a line is generated (check and build need none) and never printed.
function service(name: ExternalService): ServiceDependencies {
  return { fetch, key: () => apiKeyOf(name, { env: process.env, home: homedir() }), wait: realWait };
}

const PROVIDERS: Readonly<Record<VoiceProviderName, (folder: string, project: Project) => VoiceProvider>> = {
  qwen: (_folder, project) => new LazyVoice(() => qwenVoice(project)),
  recording: (folder) => new RecordingVoice(folder),
  elevenlabs: () => new ElevenLabsVoice(service('elevenlabs'), externalSettings(process.env)),
  fish: () => new FishVoice(service('fish'), externalSettings(process.env)),
};

export function voiceOf(folder: string, project: Project): VoiceProvider {
  return PROVIDERS[project.voice().provider](folder, project);
}
