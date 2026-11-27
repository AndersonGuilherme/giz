import { ASPECTS } from '../../../shared/contract.ts';
import { FORMATS, IDEA_LIMITS } from '../../../shared/projects.ts';
import { INTERFACE_LANGUAGES } from '../../../shared/settings.ts';
import { useTranslate } from '../../i18n.ts';
import type { DraftField, IdeaDraft } from '../../idea/ideaDraft.ts';
import { Segmented } from '../common/Segmented.tsx';
import { TextField } from '../common/TextField.tsx';
import { DurationField } from './DurationField.tsx';

type Props = Readonly<{ draft: IdeaDraft; change: (patch: Partial<IdeaDraft>) => void; problems: readonly DraftField[] }>;

function Profile({ draft, change }: Omit<Props, 'problems'>) {
  const translate = useTranslate();
  return (
    <div className="form-row">
      <Segmented label={translate('idea.format')} value={draft.format} options={FORMATS} name={(format) => translate(`format.${format}`)} onChange={(format) => change({ format })} testId="idea-format" />
      <Segmented label={translate('idea.aspect')} value={draft.aspect} options={ASPECTS} name={(aspect) => translate(`idea.aspect.${aspect}`)} onChange={(aspect) => change({ aspect })} testId="idea-aspect" />
      <Segmented label={translate('idea.language')} value={draft.language} options={INTERFACE_LANGUAGES} name={(language) => translate(`language.${language}`)} onChange={(language) => change({ language })} testId="idea-language" />
    </div>
  );
}

/** The idea's own fields: format, aspect, language, duration, theme, audience and tone. */
export function IdeaForm({ draft, change, problems }: Props) {
  const translate = useTranslate();
  const touched = (field: 'theme' | 'audience' | 'tone') => draft[field] !== '' && problems.includes(field);
  return (
    <section className="card form-card">
      <Profile draft={draft} change={change} />
      <DurationField seconds={draft.targetSeconds} onChange={(targetSeconds) => change({ targetSeconds })} invalid={problems.includes('targetSeconds')} />
      <TextField label={translate('idea.theme')} value={draft.theme} multiline onChange={(theme) => change({ theme })} placeholder={translate('idea.themeExample')} testId="idea-theme" invalid={touched('theme')} hint={translate('idea.themeHint', { most: IDEA_LIMITS.theme })} />
      <div className="form-row two">
        <TextField label={translate('idea.audience')} value={draft.audience} onChange={(audience) => change({ audience })} placeholder={translate('idea.audienceExample')} testId="idea-audience" invalid={touched('audience')} />
        <TextField label={translate('idea.tone')} value={draft.tone} onChange={(tone) => change({ tone })} placeholder={translate('idea.toneExample')} testId="idea-tone" invalid={touched('tone')} />
      </div>
    </section>
  );
}
