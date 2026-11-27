import type { Presets } from '../../../shared/projects.ts';
import { useTranslate } from '../../i18n.ts';
import { toggled, type IdeaDraft } from '../../idea/ideaDraft.ts';

type Props = Readonly<{ draft: IdeaDraft; change: (patch: Partial<IdeaDraft>) => void; presets: Presets | null }>;
type Choice = Readonly<{ id: string; name: string; title?: string }>;

function Chips({ choices, chosen, toggle }: Readonly<{ choices: readonly Choice[]; chosen: readonly string[]; toggle: (id: string) => void }>) {
  return (
    <div className="chips">
      {choices.map(({ id, name, title }) => (
        <button key={id} type="button" className={`chip-button${chosen.includes(id) ? ' on' : ''}`} aria-pressed={chosen.includes(id)} data-testid={`scene-${id}`} title={title} onClick={() => toggle(id)}>{name}</button>
      ))}
    </div>
  );
}

/** The optional ready scenes and vector backgrounds (a story opens on the first one chosen). */
export function ScenePicker({ draft, change, presets }: Props) {
  const translate = useTranslate();
  if (!presets || draft.format === 'lesson') return null;
  const toggle = (id: string) => change({ scenes: toggled(draft.scenes, id) });
  const scenes = presets.scenes.map(({ id, name, description }) => ({ id, name, title: description }));
  const backgrounds = presets.backgrounds.map((id) => ({ id, name: id }));
  return (
    <section className="card form-card">
      <h3>{translate('idea.scenes')} <span className="muted small">{translate('common.optional')}</span></h3>
      <p className="muted small">{translate('idea.scenesHint')}</p>
      <h4>{translate('idea.scenePresets')}</h4>
      <Chips choices={scenes} chosen={draft.scenes} toggle={toggle} />
      <h4>{translate('idea.backgrounds')}</h4>
      <Chips choices={backgrounds} chosen={draft.scenes} toggle={toggle} />
    </section>
  );
}
