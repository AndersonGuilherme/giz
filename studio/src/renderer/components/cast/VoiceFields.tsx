import type { CastCatalog, CharacterVoice, ProjectVoice } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { Picker } from '../common/Picker.tsx';
import { TextField } from '../common/TextField.tsx';

type Props = Readonly<{
  voice: CharacterVoice;
  project: ProjectVoice;
  catalog: CastCatalog;
  sentence: string;
  sampling: boolean;
  onVoice: (voice: CharacterVoice) => void;
  onSentence: (sentence: string) => void;
  onSample: () => void;
}>;

const capitalized = (text: string) => text.slice(0, 1).toUpperCase() + text.slice(1).replace(/_/g, ' ');

// The local voice offers its voice ids; a paid service takes the id of a voice of the person's account there.
function VoiceId({ voice, project, catalog, onVoice }: Pick<Props, 'voice' | 'project' | 'catalog' | 'onVoice'>) {
  const translate = useTranslate();
  if (project.provider === 'recording') return <p className="muted small">{translate('cast.recordingVoice')}</p>;
  if (project.provider === 'qwen') {
    const names = Object.fromEntries(catalog.qwenVoices.map((id) => [id, capitalized(id)]));
    return <Picker label={translate('cast.voiceId')} value={voice.id} options={catalog.qwenVoices} names={names} onChange={(id) => id && onVoice({ ...voice, id })} testId="voice-id" />;
  }
  return <TextField label={translate('cast.voiceIdService', { service: translate(`voiceProvider.${project.provider}`) })} value={voice.id} onChange={(id) => onVoice({ ...voice, id })} testId="voice-id" hint={translate('cast.voiceIdHint')} />;
}

/** The character's voice: the voice id, its style, and "ouvir amostra" with a sentence of the person's choice. */
export function VoiceFields(props: Props) {
  const translate = useTranslate();
  const { voice, project, sentence, sampling, onVoice, onSentence, onSample } = props;
  const recording = project.provider === 'recording';
  const cannot = recording || sampling || !voice.id || !sentence.trim();
  return (
    <section className="card form-card" data-testid="voice-fields">
      <h3>{translate('cast.voice')} <span className="muted small">{translate(`voiceProvider.${project.provider}`)}</span></h3>
      <VoiceId {...props} />
      <TextField label={translate('cast.voiceStyle')} value={voice.style ?? ''} multiline onChange={(style) => onVoice({ ...voice, style })} testId="voice-style" hint={translate('cast.voiceStyleHint')} />
      <div className="sample-row">
        <TextField label={translate('cast.sampleSentence')} value={sentence} onChange={onSentence} testId="sample-sentence" />
        <button type="button" className="chalk-button primary" data-testid="voice-sample" disabled={cannot} onClick={onSample}>{translate(sampling ? 'cast.sampling' : 'cast.listen')}</button>
      </div>
    </section>
  );
}
