import { useEffect, useMemo, useState } from 'react';
import type { CastDocument, CharacterFile, CharacterSaved, CharacterVoice, VoiceSample } from '../../shared/cast.ts';
import type { Failure } from '../../shared/contract.ts';
import type { GizzyApi } from '../../shared/GizzyApi.ts';
import { shownAfter, type Shown } from '../cast/characterSaves.ts';
import { DraftSaver } from '../editor/draftSaver.ts';
import { onLeaving } from './leaving.ts';
import { guardClose } from './useAutosave.ts';

const DELAY = 500;
export type { SaveState } from '../cast/characterSaves.ts';

type Editing = Readonly<{ api: GizzyApi; folder: string; onSaved: (document: CastDocument) => void }>;

// Each change is saved half a second after the last one (only when core finds no problem); the pending one is sent
// when the editor goes away (another character, another tab, Settings) or the window closes, so none is lost.
// `opened`: the file as the editor opened it (kept for the editor's life: a reloaded document must not restart the saver).
function useCharacterSaves({ api, folder, onSaved }: Editing, opened: CharacterFile, draft: CharacterFile): Shown {
  const [shown, setShown] = useState<Shown>({ state: 'saved', problems: [], failure: null });
  const saver = useMemo(() => new DraftSaver<CharacterFile, CharacterSaved>({
    send: (file) => api.cast.save(folder, file),
    saved: opened,
    delay: DELAY,
    onAnswer: (answer) => {
      setShown((current) => shownAfter(current, answer));
      if (answer.result?.ok && answer.result.value.saved) onSaved(answer.result.value.document);
    },
  }), [api, folder, opened]); // onSaved is the screen's setter: stable
  useEffect(() => saver.change(draft), [saver, draft]);
  // A file written by hand may already be wrong: core's check says so when it opens, before any change.
  useEffect(() => void api.cast.check(opened).then((checked) => {
    if (checked.ok && checked.value.length > 0) setShown({ state: 'problems', problems: checked.value, failure: null });
  }), [api, opened]);
  useEffect(() => flushedOnLeaving(saver), [saver]);
  return shown;
}

// The pending change goes out before the Studio leaves the screen, when the window closes and when the editor unmounts.
function flushedOnLeaving(saver: DraftSaver<CharacterFile, CharacterSaved>): () => void {
  const [stopLeaving, stopClose] = [onLeaving(() => saver.flush()), guardClose(saver)];
  return () => {
    stopLeaving();
    stopClose();
    void saver.flush();
  };
}

/** The character being edited, saved as it changes, and its voice sample (heard with the project voice). */
export function useCharacterDraft(editing: Editing, initial: CharacterFile) {
  const { api, folder } = editing;
  const [opened] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const saving = useCharacterSaves(editing, opened, draft);
  const [sample, setSample] = useState<Readonly<{ sample: VoiceSample | null; said: number; busy: boolean; failure: Failure | null }>>({ sample: null, said: 0, busy: false, failure: null });
  const listen = async (voice: CharacterVoice, sentence: string) => {
    setSample((now) => ({ ...now, busy: true, failure: null }));
    const answer = await api.cast.sample(folder, voice, sentence);
    setSample((now) => (answer.ok ? { sample: answer.value, said: now.said + 1, busy: false, failure: null } : { ...now, busy: false, failure: answer.failure }));
  };
  return { draft, setDraft, ...saving, sample, listen: (voice: CharacterVoice, sentence: string) => void listen(voice, sentence) };
}
