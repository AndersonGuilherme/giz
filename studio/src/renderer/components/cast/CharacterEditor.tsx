import { useState } from 'react';
import type { CastCatalog, CastDocument, CastMember, CharacterFile, ProjectVoice, RigInfo } from '../../../shared/cast.ts';
import type { GizApi } from '../../../shared/GizApi.ts';
import { useTranslate } from '../../i18n.ts';
import { useCharacterDraft } from '../../state/useCharacterDraft.ts';
import { parametersOf } from '../../cast/characterDraft.ts';
import { FailurePanel } from '../FailurePanel.tsx';
import { BodyFields } from './BodyFields.tsx';
import { IdentityFields } from './IdentityFields.tsx';
import { LivePreview, type Gestures } from './LivePreview.tsx';
import { usePaidSample } from './PaidSample.tsx';
import { SaveStatus } from './SaveStatus.tsx';
import { VoiceFields } from './VoiceFields.tsx';

type Props = Readonly<{
  api: GizApi;
  folder: string;
  member: CastMember;
  catalog: CastCatalog;
  gestures: Gestures;
  voice: ProjectVoice;
  onSaved: (document: CastDocument) => void;
  onRemove: () => void;
  voicesBusy: boolean;
}>;

const rigOf = (catalog: CastCatalog, file: CharacterFile): RigInfo | undefined => catalog.rigs.find(({ id }) => id === file.rig);

function Preview({ file, catalog, gestures, sentence, sample }: Readonly<{ file: CharacterFile; catalog: CastCatalog; gestures: Gestures; sentence: string; sample: ReturnType<typeof useCharacterDraft>['sample'] }>) {
  const translate = useTranslate();
  const rig = rigOf(catalog, file);
  if (!rig) return <section className="live-preview card voice-only" data-testid="live-preview"><p>{translate('cast.voiceOnly')}</p></section>;
  return <LivePreview id={file.id} rig={rig.id} parameters={parametersOf(file, rig)} expression={file.defaultExpression} gestures={gestures} sentence={sentence} speech={sample.sample} said={sample.said} />;
}

/** One character: who it is, its body (rig and parameters), its voice, and the live preview beside them. */
export function CharacterEditor({ api, folder, member, catalog, gestures, voice, onSaved, onRemove, voicesBusy }: Props) {
  const translate = useTranslate();
  const { draft, setDraft, state, problems, failure, sample, listen } = useCharacterDraft({ api, folder, onSaved }, member.file);
  const [sentence, setSentence] = useState(translate('cast.defaultSentence', { name: member.file.name }));
  const paid = usePaidSample(voice, () => listen(draft.voice, sentence));
  const head = <SaveStatus state={state} problems={problems} failure={failure} />;
  return (
    <div className="character-editor" data-testid={`character-${member.file.id}`}>
      <div className="character-fields">
        <div className="character-head">{head}<button type="button" className="chalk-button quiet small" data-testid="member-remove" onClick={onRemove}>{translate('cast.remove')}</button></div>
        <IdentityFields file={draft} gestures={gestures} onChange={setDraft} />
        <BodyFields file={draft} catalog={catalog} onChange={setDraft} />
        <VoiceFields voice={draft.voice} project={voice} catalog={catalog} sentence={sentence} sampling={sample.busy} voicesBusy={voicesBusy} onVoice={(next) => setDraft({ ...draft, voice: next })} onSentence={setSentence} onSample={paid.onSample} />
        {sample.failure && <FailurePanel failure={sample.failure} />}{paid.dialog}
      </div>
      <aside className="character-side"><Preview file={draft} catalog={catalog} gestures={gestures} sentence={sentence} sample={sample} /></aside>
    </div>
  );
}
