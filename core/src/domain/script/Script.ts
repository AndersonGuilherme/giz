import { DomainError } from '../DomainError.ts';
import type { Line } from './Line.ts';
import type { Lines } from './Lines.ts';

function rejectMissingChapter(line: Line, total: number): void {
  const chapter = line.chapter();
  if (chapter.existsIn(total)) return;
  throw new DomainError(`fala ${line.id()}: capítulo ${chapter.number()} não existe (há ${total})`);
}

export class Script {
  readonly #chapters: readonly string[];
  readonly #lines: Lines;

  private constructor(chapters: readonly string[], lines: Lines) {
    this.#chapters = chapters;
    this.#lines = lines;
  }

  static of(chapters: readonly string[], lines: Lines): Script {
    if (chapters.length === 0) throw new DomainError('o roteiro precisa de pelo menos um capítulo');
    lines.each().forEach((line) => rejectMissingChapter(line, chapters.length));
    return new Script([...chapters], lines);
  }

  chapters(): readonly string[] {
    return this.#chapters;
  }

  lines(): Lines {
    return this.#lines;
  }
}
