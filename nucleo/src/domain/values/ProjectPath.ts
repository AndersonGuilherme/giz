import { DomainError } from '../DomainError.ts';

const ABSOLUTE = /^([/\\]|[A-Za-z]:)/;
const EXAMPLE = '(ex.: scenarios/room.png)';

const segmentsOf = (text: string): string[] => text.split(/[/\\]/);

// How deep each segment goes from the project folder; below zero, the path has left it.
function leavesFolder(text: string): boolean {
  const depths = segmentsOf(text).reduce<number[]>((walked, segment) => {
    const depth = walked.at(-1) ?? 0;
    return [...walked, depth + (segment === '..' ? -1 : 1)];
  }, []);
  return depths.some((depth) => depth < 0);
}

const withoutDots = (text: string): string => segmentsOf(text).filter((segment) => segment !== '.').join('/');
const withoutFirst = (text: string): string => segmentsOf(text).slice(1).join('/');

function refusal(text: string): string | undefined {
  if (ABSOLUTE.test(text)) return `caminho absoluto "${text}": use um caminho relativo à pasta do projeto ${EXAMPLE}`;
  if (leavesFolder(text)) return `"${text}" sai da pasta do projeto: use um caminho dentro dela ${EXAMPLE}`;
  if (segmentsOf(text).includes('.')) return `escreva "${withoutDots(text)}", sem "./"`;
  // The project folder is served as the render public folder: a path naming "public/" first would not be found.
  if (segmentsOf(text)[0] === 'public') return `escreva "${withoutFirst(text)}", sem "public/" (o caminho é relativo à pasta do projeto)`;
  return undefined;
}

/** A file of the project (a scenario image), relative to the project folder and never outside it. */
export class ProjectPath {
  readonly #text: string;

  private constructor(text: string) {
    this.#text = text;
  }

  static of(text: string): ProjectPath {
    const message = refusal(text);
    if (message) throw new DomainError(message);
    return new ProjectPath(text);
  }

  text(): string {
    return this.#text;
  }
}
