import type { LineJson } from '../../../shared/script.ts';
import { withField } from '../../editor/scriptEdits.ts';
import { useEditorTools } from './EditorContext.ts';

const textOf = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/** One line of the script and how to change one of its fields (typing in a field is one step to undo). */
export function useLine(index: number) {
  const tools = useEditorTools();
  const line = tools.script.lines[index] as LineJson;
  const set = (field: string, value: unknown) => tools.edit((script) => withField(script, { index, field, value }), `${index}.${field}`);
  const text = (field: string) => textOf(line[field]);
  return { ...tools, line, set, text };
}
