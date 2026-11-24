export type TokenKind = 'keyword' | 'type' | 'function' | 'string' | 'number' | 'comment' | 'space' | 'identifier' | 'punctuation';
export type Token = Readonly<{ text: string; kind: TokenKind }>;

const STRING = String.raw`'(?:[^'\\]|\\.)*'|` + '`(?:[^`\\\\]|\\\\.)*`' + String.raw`|"(?:[^"\\]|\\.)*"`;
const REST = String.raw`(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)`;
// Capture groups of the pattern, in order: comment, string, number, word, space; anything else is punctuation.
const GROUP_KINDS: readonly TokenKind[] = ['comment', 'string', 'number', 'identifier', 'space'];
const WORD_GROUP = 4;
const CALL = /^\s*\(/;
const TYPE_NAME = /^[A-Z]/;

/** A programming language for highlighting: its keywords and how a line comment starts. */
export class CodeLanguage {
  static readonly TYPESCRIPT = new CodeLanguage(
    ['export', 'class', 'const', 'let', 'var', 'if', 'else', 'for', 'of', 'in', 'while', 'return', 'new', 'import', 'type', 'interface',
      'function', 'from', 'true', 'false', 'null', 'undefined', 'this', 'private', 'public', 'readonly', 'implements', 'extends',
      'async', 'await', 'throw', 'static'],
    '//',
  );
  static readonly PYTHON = new CodeLanguage(
    ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'in', 'while', 'import', 'from', 'as', 'with', 'True', 'False', 'None',
      'self', 'pass', 'raise', 'try', 'except', 'lambda', 'and', 'or', 'not', 'is', 'async', 'await'],
    '#',
  );
  static readonly JAVA = new CodeLanguage(
    ['public', 'private', 'protected', 'class', 'interface', 'void', 'return', 'new', 'if', 'else', 'for', 'while', 'import', 'package',
      'static', 'final', 'extends', 'implements', 'true', 'false', 'null', 'this', 'throw', 'throws', 'int', 'boolean'],
    '//',
  );

  readonly #keywords: ReadonlySet<string>;
  readonly #pattern: RegExp;

  private constructor(keywords: readonly string[], comment: string) {
    this.#keywords = new Set(keywords);
    this.#pattern = new RegExp(`(${comment}.*$)|(${STRING})|${REST}`, 'g');
  }

  /** From the extension of the file name in the code title; TypeScript when there is none or it is unknown. */
  static fromFileName(name: string): CodeLanguage {
    const extension = name.split('.').at(-1)?.toLowerCase();
    const known: Readonly<Record<string, CodeLanguage>> = { py: CodeLanguage.PYTHON, java: CodeLanguage.JAVA };
    return known[extension ?? ''] ?? CodeLanguage.TYPESCRIPT;
  }

  matches(line: string): RegExpMatchArray[] {
    return [...line.matchAll(this.#pattern)];
  }

  isKeyword(word: string): boolean {
    return this.#keywords.has(word);
  }
}

function wordKind(word: string, after: string, language: CodeLanguage): TokenKind {
  if (language.isKeyword(word)) return 'keyword';
  if (TYPE_NAME.test(word)) return 'type';
  if (CALL.test(after)) return 'function';
  return 'identifier';
}

function tokenOf(match: RegExpMatchArray, line: string, language: CodeLanguage): Token {
  const [text] = match;
  const group = GROUP_KINDS.findIndex((_kind, index) => match[index + 1] !== undefined);
  if (group === -1) return { text, kind: 'punctuation' };
  if (group + 1 !== WORD_GROUP) return { text, kind: GROUP_KINDS[group]! };
  return { text, kind: wordKind(text, line.slice(match.index! + text.length), language) };
}

/** Port of the motor's `tokenize`: splits a code line into tokens that, joined, give the line back. */
export class Tokens {
  static of(line: string, language: CodeLanguage): Token[] {
    return language.matches(line).map((match) => tokenOf(match, line, language));
  }
}
