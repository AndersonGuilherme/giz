import type { z } from 'zod';
import { ProjectError, type Problem } from '../../application/ports/ProjectError.ts';

/** A zod 4 issue; parsed with `reportInput: true`, so each one carries the `input` it refused. */
type Issue = z.core.$ZodIssue;
type Translator = (issue: Issue) => string | undefined;

const TYPE_NAMES: Record<string, string> = {
  string: 'texto', number: 'número', int: 'número inteiro', boolean: 'verdadeiro ou falso', object: 'objeto', array: 'lista', null: 'nulo',
};
const typeName = (type: string) => TYPE_NAMES[type] ?? type;

// zod 4 no longer says what came: the type is read from the refused input.
function receivedType(input: unknown): string {
  if (input === null) return 'null';
  return Array.isArray(input) ? 'array' : typeof input;
}

const required: Translator = (issue) =>
  issue.code === 'invalid_type' && issue.input === undefined ? 'obrigatório' : undefined;
// zod 4 refuses a fraction where an integer goes as a wrong type (`int`): it is a number, just not a whole one.
const notInteger: Translator = (issue) =>
  issue.code === 'invalid_type' && issue.expected === 'int' && typeof issue.input === 'number' ? 'esperava número inteiro' : undefined;
const wrongType: Translator = (issue) =>
  issue.code === 'invalid_type' ? `esperava ${typeName(issue.expected)}, veio ${typeName(receivedType(issue.input))}` : undefined;
// An enum and a literal both refuse with `invalid_value`: a literal has a single value.
const invalidOption: Translator = (issue) =>
  issue.code === 'invalid_value' && issue.values.length > 1 ? `"${String(issue.input)}" inválido (use ${issue.values.join(', ')})` : undefined;
const invalidLiteral: Translator = (issue) =>
  issue.code === 'invalid_value' ? `esperava ${JSON.stringify(issue.values[0])}, veio ${JSON.stringify(issue.input)}` : undefined;
const invalidSceneType: Translator = (issue) =>
  issue.code === 'invalid_union' && issue.discriminator !== undefined && 'options' in issue && issue.options
    ? `tipo inválido (use ${issue.options.join(', ')})`
    : undefined;
const tooSmall: Translator = (issue) => {
  if (issue.code !== 'too_small') return undefined;
  if (issue.origin === 'string') return 'não pode ser vazio';
  return issue.origin === 'array' ? `precisa de pelo menos ${issue.minimum} item(ns)` : `deve ser no mínimo ${issue.minimum}`;
};
const tooBig: Translator = (issue) =>
  issue.code === 'too_big' ? `deve ser no máximo ${issue.maximum}` : undefined;

const TRANSLATORS = [required, notInteger, wrongType, invalidOption, invalidLiteral, invalidSceneType, tooSmall, tooBig];

function issueMessage(issue: Issue): string {
  return TRANSLATORS.map((translate) => translate(issue)).find(Boolean) ?? issue.message;
}

/** `['lines', 0, 'speaker']` becomes `lines[0].speaker`. */
export function readablePath(parts: readonly PropertyKey[]): string {
  return parts.reduce<string>((text, part) => {
    if (typeof part === 'number') return `${text}[${part}]`;
    return text ? `${text}.${String(part)}` : String(part);
  }, '');
}

function issueProblems(file: string, issue: Issue): Problem[] {
  if (issue.code !== 'unrecognized_keys') {
    return [{ file, path: readablePath(issue.path), message: issueMessage(issue) }];
  }
  return issue.keys.map((key) => ({ file, path: readablePath([...issue.path, key]), message: 'campo desconhecido' }));
}

/** Gathers the problems of every file so they come out at once. */
export class ProblemCollector {
  readonly #problems: Problem[] = [];

  add(problem: Problem): void {
    this.#problems.push(problem);
  }

  addFromZod(file: string, issues: readonly Issue[]): void {
    issues.forEach((issue) => this.#problems.push(...issueProblems(file, issue)));
  }

  failIfAny(): void {
    if (this.#problems.length > 0) this.fail();
  }

  fail(): never {
    throw new ProjectError([...this.#problems]);
  }
}
