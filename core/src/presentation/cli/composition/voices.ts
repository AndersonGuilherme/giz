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
import { OwnRecordingFirst } from '../../../infrastructure/voice/OwnRecordingFirst.ts';
import { RecordingVoice } from '../../../infrastructure/voice/RecordingVoice.ts';
import { installConfig } from './install.ts';

// QwenVoice loads onnxruntime-node (and the model): it is imported only when a line is generated, so check, build,
// render and sheet start fast and never touch the GPU.
async function qwenVoice(project: Project): Promise<VoiceProvider> {
  const { QwenVoice } = await import('../../../infrastructure/voice/QwenVoice.ts');
  return new QwenVoice(installConfig(), project.voice().model);
}

/** A paid voice's key (the Studio's own key store; absent: the environment or ~/.config/gizzycera); throws a readable error without one. */
export type VoiceKeys = (service: ExternalService) => string;

const cliVoiceKeys: VoiceKeys = (name) => apiKeyOf(name, { env: process.env, home: homedir() });

// The key is read only when a line is generated (check and build need none) and never printed.
function service(name: ExternalService, keys: VoiceKeys): ServiceDependencies {
  return { fetch, key: () => keys(name), wait: realWait };
}

type Source = Readonly<{ folder: string; project: Project; keys: VoiceKeys }>;

const PROVIDERS: Readonly<Record<VoiceProviderName, (source: Source) => VoiceProvider>> = {
  qwen: ({ project }) => new LazyVoice(() => qwenVoice(project)),
  recording: ({ folder }) => new RecordingVoice(folder),
  elevenlabs: ({ keys }) => new ElevenLabsVoice(service('elevenlabs', keys), externalSettings(process.env)),
  fish: ({ keys }) => new FishVoice(service('fish', keys), externalSettings(process.env)),
};

/** The project voice; a line the person recorded (`recordings/<id>.wav`) comes from that take, whatever the voice. */
export function voiceOf(folder: string, project: Project, keys: VoiceKeys = cliVoiceKeys): VoiceProvider {
  const provider = project.voice().provider;
  const voice = PROVIDERS[provider]({ folder, project, keys });
  return provider === 'recording' ? voice : new OwnRecordingFirst(voice, folder);
}
