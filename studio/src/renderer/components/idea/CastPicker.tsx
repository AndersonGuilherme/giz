import type { CastPresetBrief, Portraits, Presets } from '../../../shared/projects.ts';
import { useTranslate } from '../../i18n.ts';
import { LESSON_PRESENTERS, toggled, type IdeaDraft } from '../../idea/ideaDraft.ts';
import { Portrait } from './Portrait.tsx';

type Props = Readonly<{ draft: IdeaDraft; change: (patch: Partial<IdeaDraft>) => void; presets: Presets | null; portraits: Portraits | null; invalid: boolean }>;

function Hint({ draft, invalid }: Readonly<{ draft: IdeaDraft; invalid: boolean }>) {
  const translate = useTranslate();
  const text = draft.format === 'lesson' ? translate('idea.castLesson', { most: LESSON_PRESENTERS }) : translate('idea.castStory');
  return <p className={invalid ? 'warning-text' : 'muted small'}>{text}{draft.cast.length > 0 && ` · ${translate('idea.castChosen', { count: draft.cast.length })}`}</p>;
}

type ChoiceProps = Readonly<{ preset: CastPresetBrief; chosen: boolean; portraits: Portraits | null; toggle: () => void }>;

function CastChoice({ preset, chosen, portraits, toggle }: ChoiceProps) {
  const { id, name, personality } = preset;
  return (
    <li>
      <button type="button" className={`cast-choice${chosen ? ' on' : ''}`} aria-pressed={chosen} data-testid={`cast-${id}`} title={personality} onClick={toggle}>
        <Portrait id={id} name={name} portraits={portraits} />
        <span className="cast-name">{name}</span>
      </button>
    </li>
  );
}

/** The optional ready characters, as portraits: none chosen lets the AI choose (or the narrator alone, by hand). */
export function CastPicker({ draft, change, presets, portraits, invalid }: Props) {
  const translate = useTranslate();
  const cast = presets?.cast.filter(({ rig }) => rig !== null) ?? [];
  return (
    <section className="card form-card">
      <h3>{translate('idea.cast')} <span className="muted small">{translate('common.optional')}</span></h3>
      <Hint draft={draft} invalid={invalid} />
      {!portraits && presets && <p className="muted small" data-testid="portraits-loading">{translate('idea.portraitsLoading')}</p>}
      <ul className="cast-grid" data-testid="cast-picker">
        {cast.map((preset) => <CastChoice key={preset.id} preset={preset} chosen={draft.cast.includes(preset.id)} portraits={portraits} toggle={() => change({ cast: toggled(draft.cast, preset.id) })} />)}
      </ul>
    </section>
  );
}
