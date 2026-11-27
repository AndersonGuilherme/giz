import type { EditorReport, ScriptJson } from '../../shared/script.ts';
import { DraftSaver, type DraftAnswer } from './draftSaver.ts';

export type { SaveStatus } from './draftSaver.ts';
export type SaveAnswer = DraftAnswer<EditorReport>;

/** The script editor's saver: the script saved a moment after it stops changing (see DraftSaver). */
export class ScriptSaver extends DraftSaver<ScriptJson, EditorReport> {}
