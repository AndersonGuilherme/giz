import { createContext, useContext } from 'react';
import type { GizApi } from '../../../shared/GizApi.ts';
import type { EditorProblem, ScriptDocument, ScriptJson, Vocabulary } from '../../../shared/script.ts';

/** What every part of the editor reads and how it changes the script (`key`: what is typed, for one undo step). */
export type EditorTools = Readonly<{
  api: GizApi;
  document: ScriptDocument;
  script: ScriptJson;
  vocabulary: Vocabulary;
  errors: readonly EditorProblem[];
  warnings: readonly EditorProblem[];
  edit: (change: (script: ScriptJson) => ScriptJson, key?: string) => void;
  selected: number | null;
  select: (line: number | null) => void;
}>;

export const EditorContext = createContext<EditorTools | null>(null);

export function useEditorTools(): EditorTools {
  const tools = useContext(EditorContext);
  if (!tools) throw new Error('useEditorTools outside the editor');
  return tools;
}
