import { useRef } from 'react';
import type { ScenariosDocument, SceneCard } from '../../../shared/scenarios.ts';
import { useTranslate } from '../../i18n.ts';
import { Picker } from '../common/Picker.tsx';
import { SceneThumb } from './SceneThumb.tsx';

/** What a card's buttons do. */
export type SceneActions = Readonly<{
  vector: (card: SceneCard, vector: string) => void;
  upload: (card: SceneCard, file: File) => void;
  useGenerated: (card: SceneCard) => void;
  generate: (card: SceneCard) => void;
  crop: (card: SceneCard) => void;
}>;
type Props = Readonly<{ card: SceneCard; document: ScenariosDocument; actions: SceneActions }>;

const THUMB = { '9:16': 168, '16:9': 300 } as const;

// The person's own picture, shown: the one that can be cropped.
const ownPicture = (card: SceneCard) => (card.background.kind === 'image' && card.background.own && card.background.url ? card.background : undefined);

function CropBadge({ card }: Readonly<{ card: SceneCard }>) {
  const translate = useTranslate();
  if (card.background.kind !== 'image' || !card.background.crop) return null;
  return <span className="badge quiet" data-testid={`scene-cropped-${card.lineId}`}>{translate('scenarios.cropped')}</span>;
}

function CropButton({ card, actions }: Readonly<{ card: SceneCard; actions: SceneActions }>) {
  const translate = useTranslate();
  if (!ownPicture(card)) return null;
  return <button type="button" className="chalk-button small" data-testid={`scene-crop-${card.lineId}`} onClick={() => actions.crop(card)}>{translate('scenarios.crop')}</button>;
}

function Badges({ card }: Readonly<{ card: SceneCard }>) {
  const translate = useTranslate();
  const own = card.background.kind === 'image' && card.background.own;
  return (
    <div className="scene-badges">
      <span className="badge quiet">{translate(`scenarios.kind.${own ? 'own' : card.background.kind === 'image' ? 'generated' : 'vector'}`)}</span>
      <CropBadge card={card} />
      {card.state && <span className={`badge state-${card.state}`} data-testid={`scene-state-${card.lineId}`} data-state={card.state}>{translate(`scenarios.state.${card.state}`)}</span>}
    </div>
  );
}

function Upload({ card, actions }: Readonly<{ card: SceneCard; actions: SceneActions }>) {
  const translate = useTranslate();
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp" data-testid={`scene-file-${card.lineId}`} onChange={(event) => event.target.files?.[0] && actions.upload(card, event.target.files[0])} />
      <button type="button" className="chalk-button small" data-testid={`scene-upload-${card.lineId}`} onClick={() => input.current?.click()}>{translate('scenarios.upload')}</button>
    </>
  );
}

function Actions({ card, document, actions }: Props) {
  const translate = useTranslate();
  const own = card.background.kind === 'image' && card.background.own;
  return (
    <div className="scene-actions">
      <Picker label={translate('scenarios.vector')} value={card.background.kind === 'vector' ? card.background.vector : undefined} options={document.vectors} group="background" empty={translate('scenarios.chooseVector')} onChange={(vector) => vector && actions.vector(card, vector)} testId={`scene-vector-${card.lineId}`} />
      <div className="scene-buttons">
        <Upload card={card} actions={actions} />
        <button type="button" className="chalk-button small primary" data-testid={`scene-generate-${card.lineId}`} onClick={() => actions.generate(card)}>{translate(card.generated ? 'scenarios.regenerate' : 'scenarios.generate')}</button>
        <CropButton card={card} actions={actions} />
        {own && card.generate && <button type="button" className="chalk-button small quiet" data-testid={`scene-use-generated-${card.lineId}`} onClick={() => actions.useGenerated(card)}>{translate('scenarios.useGenerated')}</button>}
      </div>
    </div>
  );
}

function Notes({ card }: Readonly<{ card: SceneCard }>) {
  const translate = useTranslate();
  const image = card.background.kind === 'image' ? card.background : undefined;
  const notes = [
    { text: image?.aspectWarning, kind: 'warning-text', id: 'warning' },
    { text: image?.own && card.generate ? translate('scenarios.ownWins') : undefined, kind: 'muted', id: 'own' },
    { text: card.problem, kind: 'warning-text', id: 'problem' },
  ];
  return (
    <>
      {notes.filter(({ text }) => text).map(({ text, kind, id }) => <p key={id} className={`${kind} small`} data-testid={`scene-${id}-${card.lineId}`}>{text}</p>)}
    </>
  );
}

/** One scenario scene: its thumbnail, the line that opens it, its state and its actions. */
export function SceneTile({ card, document, actions }: Props) {
  const translate = useTranslate();
  return (
    <li className="scene-tile card" data-testid={`scene-${card.lineId}`}>
      <div className="scene-picture">
        <SceneThumb background={card.background} aspect={document.aspect} width={THUMB[document.aspect]} />
        {card.generated && card.background.kind === 'image' && card.background.own && <img className="generated-corner" src={card.generated} alt={translate('scenarios.generatedOne')} title={translate('scenarios.generatedOne')} />}
      </div>
      <div className="scene-info">
        <p className="scene-line"><b>{translate('editor.lineNumber', { number: card.number })}</b> {card.text}</p>
        <Badges card={card} />
        {card.generate && <p className="scene-prompt small">“{card.generate.prompt}”</p>}
        <Notes card={card} />
        <Actions card={card} document={document} actions={actions} />
      </div>
    </li>
  );
}
