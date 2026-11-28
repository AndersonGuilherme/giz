import type { CastCatalog, CharacterFile, ParameterInfo, RigInfo } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { drawableParameters, isPreviewed, parametersOf, PREVIEWED, withParameter, withRig } from '../../cast/characterDraft.ts';
import { languageOf } from '../../media/money.ts';
import { Segmented } from '../common/Segmented.tsx';
import { ParameterField } from './ParameterField.tsx';

type Props = Readonly<{ file: CharacterFile; catalog: CastCatalog; onChange: (file: CharacterFile) => void }>;

// The drawn options first (in PREVIEWED's order), then the colors, the numbers and the switches.
const TYPE_ORDER: Readonly<Record<ParameterInfo['type'], number>> = { option: 0, color: 1, number: 2, boolean: 3 };
const orderOf = ([name, info]: readonly [string, ParameterInfo]) => (isPreviewed(name) ? PREVIEWED.indexOf(name as (typeof PREVIEWED)[number]) : 20 + TYPE_ORDER[info.type] * 20);

function Parameters({ file, rig, onChange }: Readonly<{ file: CharacterFile; rig: RigInfo; onChange: (file: CharacterFile) => void }>) {
  const values = parametersOf(file, rig);
  const entries = Object.entries(rig.parameters).sort((one, other) => orderOf(one) - orderOf(other));
  const drawable = drawableParameters(file, rig).parameters;
  const preview = (name: string) => (option: string) => ({ rig: rig.id, parameters: { ...drawable, [name]: option } });
  return (
    <div className="parameter-grid">
      {entries.map(([name, info]) => (
        <ParameterField key={name} name={name} info={info} value={values[name]!} preview={info.type === 'option' && isPreviewed(name) ? preview(name) : undefined} onChange={(value) => onChange(withParameter(file, rig, { name, value }))} />
      ))}
    </div>
  );
}

/** The body: the rig (how it is drawn) and every parameter of that rig. The narrator has no body: only a voice. */
export function BodyFields({ file, catalog, onChange }: Props) {
  const translate = useTranslate();
  const rig = catalog.rigs.find(({ id }) => id === file.rig);
  if (!file.rig) return <section className="card form-card"><h3>{translate('cast.body')}</h3><p className="muted small">{translate('cast.voiceOnly')}</p></section>;
  const language = languageOf(translate);
  const pick = (id: string) => onChange(withRig(file, catalog.rigs.find((each) => each.id === id)!));
  return (
    <section className="card form-card" data-testid="body-fields">
      <h3>{translate('cast.body')}</h3>
      <Segmented label={translate('cast.rig')} value={file.rig} options={catalog.rigs.map(({ id }) => id)} name={(id) => catalog.rigs.find((each) => each.id === id)?.name[language] ?? id} onChange={pick} testId="character-rig" />
      {rig ? <Parameters file={file} rig={rig} onChange={onChange} /> : <p className="warning-text">{translate('cast.unknownRig', { rig: file.rig })}</p>}
    </section>
  );
}
