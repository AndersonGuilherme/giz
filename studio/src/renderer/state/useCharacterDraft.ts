import { useEffect, useRef, useState } from 'react';
import type { CastDocument, CharacterFile, CharacterProblem, CharacterVoice, VoiceSample } from '../../shared/cast.ts';
import type { Failure } from '../../shared/contract.ts';
import type { GizApi } from '../../shared/GizApi.ts';

const DELAY = 500;
/** `saved`: on disk as shown; `waiting`: a change not saved yet; `problems`: core refused it (nothing written). */
export type SaveState = 'saved' | 'waiting' | 'problems';

// Each change is saved half a second after the last one (only when core finds no problem); an older answer is dropped.
type Editing = Readonly<{ api: GizApi; folder: string; onSaved: (document: CastDocument) => void }>;

function useAutosave({ api, folder, onSaved }: Editing, draft: CharacterFile) {
  const [state, setState] = useState<SaveState>('saved');
  const [problems, setProblems] = useState<readonly CharacterProblem[]>([]);
  const first = useRef(true);
  const turn = useRef(0);
  useEffect(() => {
    if (first.current) return void (first.current = false);
    setState('waiting');
    const mine = (turn.current += 1);
    const timer = setTimeout(() => void api.cast.save(folder, draft).then((answer) => {
      if (mine !== turn.current || !answer.ok) return;
      setProblems(answer.value.problems);
      setState(answer.value.saved ? 'saved' : 'problems');
      if (answer.value.saved) onSaved(answer.value.document);
    }), DELAY);
    return () => clearTimeout(timer);
  }, [api, folder, draft]); // onSaved is the screen's setter: stable
  return { state, problems };
}

/** The character being edited, saved as it changes, and its voice sample (heard with the project voice). */
export function useCharacterDraft(editing: Editing, initial: CharacterFile) {
  const { api, folder } = editing;
  const [draft, setDraft] = useState(initial);
  const saving = useAutosave(editing, draft);
  const [sample, setSample] = useState<Readonly<{ sample: VoiceSample | null; said: number; busy: boolean; failure: Failure | null }>>({ sample: null, said: 0, busy: false, failure: null });
  const listen = async (voice: CharacterVoice, sentence: string) => {
    setSample((now) => ({ ...now, busy: true, failure: null }));
    const answer = await api.cast.sample(folder, voice, sentence);
    setSample((now) => (answer.ok ? { sample: answer.value, said: now.said + 1, busy: false, failure: null } : { ...now, busy: false, failure: answer.failure }));
  };
  return { draft, setDraft, ...saving, sample, listen: (voice: CharacterVoice, sentence: string) => void listen(voice, sentence) };
}
