import type { EditorProblem, ScriptJson } from '../../shared/script.ts';
import type { ValidationProblem } from '../ports/ScriptCore.ts';

// `lines[3].beats[0].pose` → the line 3, its field `beats` and the rest of the path inside it, `[0].pose`.
const LINE_PATH = /^lines\[(\d+)\]\.?((\w+)?.*)$/;

function byLineId(problem: ValidationProblem, script: ScriptJson): EditorProblem | undefined {
  if (!problem.lineId) return undefined;
  const index = script.lines.findIndex(({ id }) => id === problem.lineId);
  return { line: index < 0 ? null : index, field: null, message: index < 0 ? `${problem.lineId}: ${problem.message}` : problem.message };
}

const linePathOf = ({ file, path = '' }: ValidationProblem) => (file === 'script.json' ? LINE_PATH.exec(path) : null);

const insideField = (inner: string, field: string | null) => inner.slice(field?.length ?? 0).replace(/^\./, '');

function byPath(problem: ValidationProblem): EditorProblem | undefined {
  const found = linePathOf(problem);
  if (!found) return undefined;
  const [, index, inner = '', field = null] = found;
  const rest = insideField(inner, field);
  return { line: Number(index), field, message: rest ? `${rest}: ${problem.message}` : problem.message };
}

// A problem of another file, or of the script as a whole: the file and the field in front of the message.
function wholeProject(problem: ValidationProblem): EditorProblem {
  const place = [problem.file, problem.path].filter(Boolean).join(' › ');
  return { line: null, field: null, message: place ? `${place}: ${problem.message}` : problem.message };
}

/** Where a problem of the check goes in the editor: next to its line (by id or by path) or in the project panel. */
export function editorProblemOf(problem: ValidationProblem, script: ScriptJson): EditorProblem {
  return byLineId(problem, script) ?? byPath(problem) ?? wholeProject(problem);
}
