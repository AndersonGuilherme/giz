import type { ZodIssue } from 'zod';
import { ProjectError, type Problem } from '../../application/ports/ProjectError.ts';

type Translator = (issue: ZodIssue) => string | undefined;

const TYPE_NAMES: Record<string, string> = {
  string: 'texto', number: 'número', boolean: 'verdadeiro ou falso', object: 'objeto', array: 'lista', null: 'nulo',
};
const typeName = (type: string) => TYPE_NAMES[type] ?? type;

const required: Translator = (issue) =>
  issue.code === 'invalid_type' && issue.received === 'undefined' ? 'obrigatório' : undefined;
const wrongType: Translator = (issue) =>
  issue.code === 'invalid_type' ? `esperava ${typeName(issue.expected)}, veio ${typeName(issue.received)}` : undefined;
const invalidOption: Translator = (issue) =>
  issue.code === 'invalid_enum_value' ? `"${issue.received}" inválido (use ${issue.options.join(', ')})` : undefined;
const invalidSceneType: Translator = (issue) =>
  issue.code === 'invalid_union_discriminator' ? `tipo inválido (use ${issue.options.join(', ')})` : undefined;
const invalidLiteral: Translator = (issue) =>
  issue.code === 'invalid_literal'
    ? `esperava ${JSON.stringify(issue.expected)}, veio ${JSON.stringify(issue.received)}`
    : undefined;
const tooSmall: Translator = (issue) => {
  if (issue.code !== 'too_small') return undefined;
  if (issue.type === 'string') return 'não pode ser vazio';
  return issue.type === 'array' ? `precisa de pelo menos ${issue.minimum} item(ns)` : `deve ser no mínimo ${issue.minimum}`;
};
const tooBig: Translator = (issue) =>
  issue.code === 'too_big' ? `deve ser no máximo ${issue.maximum}` : undefined;

const TRANSLATORS = [required, wrongType, invalidOption, invalidSceneType, invalidLiteral, tooSmall, tooBig];

function issueMessage(issue: ZodIssue): string {
  return TRANSLATORS.map((translate) => translate(issue)).find(Boolean) ?? issue.message;
}

/** `['lines', 0, 'speaker']` becomes `lines[0].speaker`. */
export function readablePath(parts: readonly (string | number)[]): string {
  return parts.reduce<string>((text, part) => {
    if (typeof part === 'number') return `${text}[${part}]`;
    return text ? `${text}.${part}` : part;
  }, '');
}

function issueProblems(file: string, issue: ZodIssue): Problem[] {
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

  addFromZod(file: string, issues: readonly ZodIssue[]): void {
    issues.forEach((issue) => this.#problems.push(...issueProblems(file, issue)));
  }

  failIfAny(): void {
    if (this.#problems.length > 0) this.fail();
  }

  fail(): never {
    throw new ProjectError([...this.#problems]);
  }
}
