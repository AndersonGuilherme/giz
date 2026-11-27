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
}>;

const rigOf = (catalog: CastCatalog, file: CharacterFile): RigInfo | undefined => catalog.rigs.find(({ id }) => id === file.rig);

function Preview({ file, catalog, gestures, sentence, sample }: Readonly<{ file: CharacterFile; catalog: CastCatalog; gestures: Gestures; sentence: string; sample: ReturnType<typeof useCharacterDraft>['sample'] }>) {
  const translate = useTranslate();
  const rig = rigOf(catalog, file);
  if (!rig) return <section className="live-preview card voice-only" data-testid="live-preview"><p>{translate('cast.voiceOnly')}</p></section>;
  return <LivePreview id={file.id} rig={rig.id} parameters={parametersOf(file, rig)} expression={file.defaultExpression} gestures={gestures} sentence={sentence} speech={sample.sample} said={sample.said} />;
}

/** One character: who it is, its body (rig and parameters), its voice, and the live preview beside them. */
export function CharacterEditor({ api, folder, member, catalog, gestures, voice, onSaved }: Props) {
  const translate = useTranslate();
  const { draft, setDraft, state, problems, sample, listen } = useCharacterDraft({ api, folder, onSaved }, member.file);
  const [sentence, setSentence] = useState(translate('cast.defaultSentence', { name: member.file.name }));
  return (
    <div className="character-editor" data-testid={`character-${member.file.id}`}>
      <div className="character-fields">
        <SaveStatus state={state} problems={problems} />
        <IdentityFields file={draft} gestures={gestures} onChange={setDraft} />
        <BodyFields file={draft} catalog={catalog} onChange={setDraft} />
        <VoiceFields voice={draft.voice} project={voice} catalog={catalog} sentence={sentence} sampling={sample.busy} onVoice={(next) => setDraft({ ...draft, voice: next })} onSentence={setSentence} onSample={() => listen(draft.voice, sentence)} />
        {sample.failure && <FailurePanel failure={sample.failure} />}
      </div>
      <aside className="character-side"><Preview file={draft} catalog={catalog} gestures={gestures} sentence={sentence} sample={sample} /></aside>
    </div>
  );
}
