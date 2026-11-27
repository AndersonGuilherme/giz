import { VOICE_MODELS, type VoiceModel } from '../../../shared/settings.ts';
import { voiceTaskOf, type ModelsStatus } from '../../../shared/setup.ts';
import { formatBytes } from '../../format.ts';
import { useTranslate } from '../../i18n.ts';
import { useSetup } from '../../state/SetupContext.ts';
import { ModelDownload } from './ModelCard.tsx';
import { OptionCard } from './OptionCard.tsx';

const TEXTS = {
  '0.6b': { title: 'models.small', detail: 'models.smallDetail' },
  '1.7b': { title: 'models.large', detail: 'models.largeDetail' },
} as const;

function FreeSpace({ models }: Readonly<{ models: ModelsStatus }>) {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  const values = { folder: models.modelsDir, free: formatBytes(models.freeBytes ?? 0, settings.language) };
  return (
    <div className="folder-box" data-testid="models-folder">
      <span className="disk" aria-hidden="true" />
      <code className="path">{translate(models.freeBytes === null ? 'models.freeUnknown' : 'models.free', values)}</code>
      <button type="button" className="chalk-button small" onClick={() => actions.modelsFolder('pick')}>{translate('models.changeFolder')}</button>
    </div>
  );
}

function VoiceOption({ model, models }: Readonly<{ model: VoiceModel; models: ModelsStatus }>) {
  const translate = useTranslate();
  const { settings, actions } = useSetup();
  const title = `${translate(TEXTS[model].title)} · Qwen3-TTS ${model.toUpperCase()}`;
  const badge = settings.model === model ? translate('models.chosen') : undefined;
  return (
    <OptionCard testId={`model-${model}`} selected={settings.model === model} onSelect={() => actions.update({ model })} title={title} badge={badge} detail={translate(TEXTS[model].detail)}>
      <ModelDownload task={voiceTaskOf(model)} status={models.voice[model]} freeBytes={models.freeBytes} />
    </OptionCard>
  );
}

function Whisper({ models }: Readonly<{ models: ModelsStatus }>) {
  const translate = useTranslate();
  const { settings } = useSetup();
  return (
    <div className="extra" data-testid="model-whisper">
      <div>
        <strong>{translate('models.whisper')}</strong> <span className="muted">· {formatBytes(models.whisper.bytes, settings.language)}</span>
        <p className="muted">{translate('models.whisperDetail')}</p>
      </div>
      <ModelDownload task="whisper" status={models.whisper} freeBytes={models.freeBytes} />
    </div>
  );
}

/** The local voice models: pick 0.6B or 1.7B, see the space they need, download with pause and resume; Whisper too. */
export function VoiceModelsPanel() {
  const translate = useTranslate();
  const { models } = useSetup().jobs;
  if (!models) return null;
  return (
    <>
      <p className="intro">{translate('models.intro')}</p>
      <FreeSpace models={models} />
      <div className="options" role="radiogroup" aria-label={translate('panel.models')}>
        {VOICE_MODELS.map((model) => <VoiceOption key={model} model={model} models={models} />)}
      </div>
      <Whisper models={models} />
    </>
  );
}
