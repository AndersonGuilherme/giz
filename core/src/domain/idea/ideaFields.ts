import { DomainError } from '../DomainError.ts';
import { FORMATS } from '../project/Project.ts';
import { AspectRatio } from '../values/AspectRatio.ts';
import { CharacterId } from '../values/CharacterId.ts';
import { Language } from '../values/Language.ts';

/** The problems of one field, each as `<path>: <message>`. */
type FieldRule = (value: unknown, name: string) => string[];

export const MIN_SECONDS = 10;
export const MAX_SECONDS = 900;

function refusal(error: unknown): string {
  if (!(error instanceof DomainError)) throw error;
  return error.message;
}

// The value object's own refusal message (anything else than a DomainError is a bug and goes up).
function domainProblem(factory: () => unknown): string | undefined {
  try {
    factory();
    return undefined;
  } catch (error) {
    return refusal(error);
  }
}

const fail = (name: string, message: string | undefined) => (message ? [`${name}: ${message}`] : []);

function textProblem(value: unknown, limit: number): string | undefined {
  if (value === undefined) return 'obrigatório';
  if (typeof value !== 'string') return 'esperava texto';
  if (value.trim() === '') return 'não pode ser vazio';
  return value.length > limit ? `no máximo ${limit} caracteres` : undefined;
}

const text = (limit: number): FieldRule => (value, name) => fail(name, textProblem(value, limit));

const byDomain = (factory: (text: string) => unknown): FieldRule => (value, name) =>
  typeof value === 'string' ? fail(name, domainProblem(() => factory(value))) : fail(name, textProblem(value, Infinity));

const format: FieldRule = (value, name) =>
  FORMATS.some((known) => known === value) ? [] : fail(name, textProblem(value, Infinity) ?? `"${String(value)}" inválido (use ${FORMATS.join(', ')})`);

const seconds: FieldRule = (value, name) => {
  const valid = Number.isInteger(value) && Number(value) >= MIN_SECONDS && Number(value) <= MAX_SECONDS;
  return valid ? [] : fail(name, `use um número inteiro de segundos entre ${MIN_SECONDS} e ${MAX_SECONDS}`);
};

// An optional list of texts, each checked by `item`, with no repeated entry.
const list = (item: FieldRule): FieldRule => (value, name) => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return fail(name, 'esperava uma lista de textos');
  return value.flatMap((entry, index) => {
    const path = `${name}[${index}]`;
    const repeated = value.indexOf(entry) < index ? fail(path, `"${String(entry)}" repetido`) : [];
    return [...item(entry, path), ...repeated];
  });
};

/** The fields of an idea, in the order their problems are listed. */
export const IDEA_FIELDS: Readonly<Record<string, FieldRule>> = {
  format,
  aspect: byDomain((value) => AspectRatio.of(value)),
  targetSeconds: seconds,
  theme: text(600),
  audience: text(200),
  tone: text(200),
  language: byDomain((value) => Language.of(value)),
  cast: list(byDomain((value) => CharacterId.of(value))),
  scenes: list(text(64)),
};

/** Every problem of an idea's JSON object: each field, then the unknown fields. */
export function ideaProblems(json: Readonly<Record<string, unknown>>): string[] {
  const fields = Object.entries(IDEA_FIELDS).flatMap(([name, rule]) => rule(json[name], name));
  const unknown = Object.keys(json).filter((key) => !Object.hasOwn(IDEA_FIELDS, key));
  return [...fields, ...unknown.map((key) => `${key}: campo desconhecido`)];
}
