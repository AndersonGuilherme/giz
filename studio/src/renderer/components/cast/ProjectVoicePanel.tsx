import { CAST_VOICE_PROVIDERS, QWEN_MODELS, type ProjectVoice } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { Segmented } from '../common/Segmented.tsx';

/** The project's voice service (every character speaks through it) and, for the local voice, its model. */
export function ProjectVoicePanel({ voice, onChange }: Readonly<{ voice: ProjectVoice; onChange: (voice: ProjectVoice) => void }>) {
  const translate = useTranslate();
  return (
    <section className="card project-voice" data-testid="project-voice">
      <Segmented label={translate('cast.projectVoice')} value={voice.provider} options={CAST_VOICE_PROVIDERS} name={(provider) => translate(`voiceProvider.${provider}`)} onChange={(provider) => onChange({ provider, ...(provider === 'qwen' ? { model: voice.model ?? '0.6b' } : {}) })} testId="voice-provider" />
      {voice.provider === 'qwen' && <Segmented label={translate('cast.voiceModel')} value={voice.model ?? '0.6b'} options={QWEN_MODELS} name={(model) => model.toUpperCase()} onChange={(model) => onChange({ provider: 'qwen', model })} testId="voice-model" />}
      <p className="muted small">{translate(`cast.voiceHint.${voice.provider}`)}</p>
    </section>
  );
}
