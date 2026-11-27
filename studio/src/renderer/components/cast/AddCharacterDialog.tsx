import { useState } from 'react';
import type { CastCatalog, CastDocument, CastPreset } from '../../../shared/cast.ts';
import { useTranslate } from '../../i18n.ts';
import { Modal } from '../common/Modal.tsx';
import { TextField } from '../common/TextField.tsx';
import { Face } from './CastList.tsx';

type Choice = Readonly<{ preset?: string; id?: string; name?: string }>;
type Props = Readonly<{ document: CastDocument; catalog: CastCatalog; onClose: () => void; onAdd: (choice: Choice) => void }>;

const PLAIN = /^[a-z0-9][a-z0-9_-]*$/;
const idOf = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function Presets({ presets, catalog, onAdd }: Readonly<{ presets: readonly CastPreset[]; catalog: CastCatalog; onAdd: (choice: Choice) => void }>) {
  return (
    <ul className="cast-grid preset-grid" data-testid="cast-presets">
      {presets.map((preset) => (
        <li key={preset.id}>
          <button type="button" className="cast-choice" title={preset.personality} data-testid={`preset-${preset.id}`} onClick={() => onAdd({ preset: preset.id })}>
            <Face member={preset} catalog={catalog} size={175} />
            <span className="cast-name">{preset.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NewCharacter({ onAdd }: Readonly<{ onAdd: (choice: Choice) => void }>) {
  const translate = useTranslate();
  const [name, setName] = useState('');
  const id = idOf(name);
  return (
    <div className="form-row">
      <div className="field grow"><TextField label={translate('cast.newName')} value={name} onChange={setName} testId="new-character-name" hint={id ? translate('cast.newId', { id }) : undefined} /></div>
      <button type="button" className="chalk-button" data-testid="new-character" disabled={!PLAIN.test(id)} onClick={() => onAdd({ id, name: name.trim() })}>{translate('cast.create')}</button>
    </div>
  );
}

/** Adds a ready character (its look, voice and personality copied into the project) or a new one, drawn from scratch. */
export function AddCharacterDialog({ document, catalog, onClose, onAdd }: Props) {
  const translate = useTranslate();
  const taken = new Set(document.members.map(({ file }) => file.id));
  const presets = document.presets.filter(({ id, file }) => !taken.has(id) && file.rig !== undefined);
  return (
    <Modal title={translate('cast.addTitle')} testId="add-character">
      <h4>{translate('cast.fromPresets')}</h4>
      <Presets presets={presets} catalog={catalog} onAdd={onAdd} />
      <h4>{translate('cast.fromScratch')}</h4>
      <NewCharacter onAdd={onAdd} />
      <div className="dialog-actions"><button type="button" className="chalk-button quiet" onClick={onClose}>{translate('common.close')}</button></div>
    </Modal>
  );
}
