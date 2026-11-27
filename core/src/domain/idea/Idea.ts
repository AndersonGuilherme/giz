import { DomainError } from '../DomainError.ts';
import type { Format } from '../project/Project.ts';
import { AspectRatio, type AspectRatioText } from '../values/AspectRatio.ts';
import { Language } from '../values/Language.ts';
import { ideaProblems } from './ideaFields.ts';
import { targetWords } from './speechPace.ts';

/** `idea.json`: what the video is about; `cast` (preset ids) and `scenes` (backgrounds or scene presets) are optional. */
export type IdeaJson = Readonly<{
  format: Format;
  aspect: AspectRatioText;
  targetSeconds: number;
  theme: string;
  audience: string;
  tone: string;
  language: ReturnType<Language['code']>;
  cast?: readonly string[];
  scenes?: readonly string[];
}>;

const isObject = (json: unknown): json is Readonly<Record<string, unknown>> =>
  typeof json === 'object' && json !== null && !Array.isArray(json);

/** The idea of a video, the first stage: what the text AI writes the script from. */
export class Idea {
  readonly #json: IdeaJson;

  private constructor(json: IdeaJson) {
    this.#json = json;
  }

  /** A validated idea; otherwise a DomainError listing every problem, one field per line. */
  static fromJson(json: unknown): Idea {
    if (!isObject(json)) throw new DomainError('ideia inválida: esperava um objeto JSON com format, aspect, targetSeconds, theme, audience, tone e language');
    const problems = ideaProblems(json);
    if (problems.length > 0) throw new DomainError(['ideia inválida:', ...problems.map((problem) => `- ${problem}`)].join('\n'));
    return new Idea(structuredClone(json) as IdeaJson);
  }

  format(): Format {
    return this.#json.format;
  }

  aspect(): AspectRatio {
    return AspectRatio.of(this.#json.aspect);
  }

  language(): Language {
    return Language.of(this.#json.language);
  }

  targetSeconds(): number {
    return this.#json.targetSeconds;
  }

  /** The words of speech that fit in the target duration. */
  targetWords(): number {
    return targetWords(this.language(), this.#json.targetSeconds);
  }

  /** The cast presets asked for; empty: the AI chooses. */
  castIds(): readonly string[] {
    return this.#json.cast ?? [];
  }

  /** The backgrounds or scene presets asked for; empty: the AI chooses. */
  sceneNames(): readonly string[] {
    return this.#json.scenes ?? [];
  }

  toJson(): IdeaJson {
    return this.#json;
  }
}
