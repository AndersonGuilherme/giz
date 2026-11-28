import { useCallback, useEffect, useState } from 'react';
import type { CastCatalog, CastDocument, CastMember } from '../../../shared/cast.ts';
import type { GizzyApi } from '../../../shared/GizzyApi.ts';
import { voicesBusyAfter } from '../../cast/sampleLabel.ts';
import { useTranslate } from '../../i18n.ts';
import { useStageDocument } from '../../state/useStageDocument.ts';
import { ScreenHead } from '../common/ScreenHead.tsx';
import { FailurePanel } from '../FailurePanel.tsx';
import { AddCharacterDialog } from './AddCharacterDialog.tsx';
import { CastList } from './CastList.tsx';
import { CharacterEditor } from './CharacterEditor.tsx';
import type { Gestures } from './LivePreview.tsx';
import { ProjectVoicePanel } from './ProjectVoicePanel.tsx';
import { RemoveMemberDialog } from './RemoveMemberDialog.tsx';

type Props = Readonly<{ api: GizzyApi; folder: string }>;
type Tools = Readonly<{ catalog: CastCatalog; gestures: Gestures }>;

// The rigs and voices (core's catalog) and the poses and expressions (core's script lists), read once.
function useTools(api: GizzyApi): Tools | null {
  const [tools, setTools] = useState<Tools | null>(null);
  useEffect(() => void Promise.all([api.cast.catalog(), api.script.vocabulary()]).then(([catalog, vocabulary]) => {
    if (catalog.ok && vocabulary.ok) setTools({ catalog: catalog.value, gestures: vocabulary.value });
  }), [api]);
  return tools;
}

type BodyProps = Readonly<{ api: GizzyApi; document: CastDocument; tools: Tools; selected: string; select: (id: string) => void; set: (document: CastDocument) => void; remove: (member: CastMember) => void }>;

// Busy while a voice job runs: from the document when the screen opens, then from the job's progress.
function useVoicesBusy(api: GizzyApi, opened: boolean): boolean {
  const [busy, setBusy] = useState(opened);
  useEffect(() => api.voices.onProgress((progress) => setBusy(voicesBusyAfter(progress))), [api]);
  return busy;
}

function Body({ api, document, tools, selected, select, set, remove }: BodyProps) {
  const voicesBusy = useVoicesBusy(api, document.voicesGenerating);
  const member = document.members.find(({ file }) => file.id === selected) ?? document.members[0];
  return (
    <div className="cast-body">
      <CastList document={document} catalog={tools.catalog} selected={member?.file.id ?? ''} select={select} />
      {member && <CharacterEditor key={member.file.id} api={api} folder={document.folder} member={member} catalog={tools.catalog} gestures={tools.gestures} voice={document.voice} onSaved={set} onRemove={() => remove(member)} voicesBusy={voicesBusy} />}
    </div>
  );
}

type Loaded = Readonly<{ api: GizzyApi; folder: string; document: CastDocument; tools: Tools; failure: ReturnType<typeof useStageDocument>['failure']; apply: ReturnType<typeof useStageDocument<CastDocument>>['apply'] }>;

function CastBoard({ api, folder, document, tools, failure, apply }: Loaded) {
  const translate = useTranslate();
  const [selected, select] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<CastMember | null>(null);
  const set = (next: CastDocument) => void apply(Promise.resolve({ ok: true, value: next }));
  return (
    <main className="board wide stage-screen" data-testid="cast-screen">
      <ScreenHead title={translate('cast.title')} hint={translate('cast.hint')} stages={document.stages}><button type="button" className="chalk-button primary" data-testid="cast-add" onClick={() => setAdding(true)}>{translate('cast.add')}</button></ScreenHead>
      <ProjectVoicePanel voice={document.voice} onChange={(voice) => void apply(api.cast.voice(folder, voice))} />
      {failure && <FailurePanel failure={failure} />}
      <Body api={api} document={document} tools={tools} selected={selected} select={select} set={set} remove={setRemoving} />
      {adding && <AddCharacterDialog document={document} catalog={tools.catalog} onClose={() => setAdding(false)} onAdd={(choice) => void apply(api.cast.add(folder, choice)).then((ok) => ok && [setAdding(false), select(choice.preset ?? choice.id ?? '')])} />}
      {removing && <RemoveMemberDialog member={removing} onCancel={() => setRemoving(null)} onConfirm={() => void apply(api.cast.remove(folder, removing.file.id)).then(() => setRemoving(null))} />}
    </main>
  );
}

/** The Cast stage: the project's characters on the left, the chosen one's editor and live preview on the right. */
export function CastScreen({ api, folder }: Props) {
  const translate = useTranslate();
  const load = useCallback(() => api.cast.read(folder), [api, folder]);
  const { document, failure, apply } = useStageDocument(load);
  const tools = useTools(api);
  if (!document || !tools) return failure ? <main className="board"><FailurePanel failure={failure} /></main> : <p className="hint">{translate('editor.loading')}</p>;
  return <CastBoard api={api} folder={folder} document={document} tools={tools} failure={failure} apply={apply} />;
}
