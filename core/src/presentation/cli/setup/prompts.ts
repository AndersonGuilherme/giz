import { createInterface, type Interface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;
export const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
export const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
export const dim = (text: string) => `\x1b[2m${text}\x1b[0m`;

export type Option<T extends string> = Readonly<{ value: T; label: string }>;

/** The setup questions: Enter accepts the default in brackets; without a terminal (or --defaults) every default is taken. */
export class Prompter {
  readonly #terminal: Interface | undefined;

  private constructor(terminal: Interface | undefined) {
    this.#terminal = terminal;
  }

  static open(useDefaults: boolean): Prompter {
    const automatic = useDefaults || !stdin.isTTY;
    return new Prompter(automatic ? undefined : createInterface({ input: stdin, output: stdout }));
  }

  async ask(question: string, defaultAnswer: string): Promise<string> {
    if (!this.#terminal) {
      console.log(`${question} ${dim(`[${defaultAnswer}]`)} → ${defaultAnswer}`);
      return defaultAnswer;
    }
    const answer = (await this.#terminal.question(`${question} ${dim(`[${defaultAnswer}]`)} `)).trim();
    return answer || defaultAnswer;
  }

  async yes(question: string, defaultAnswer = true): Promise<boolean> {
    const answer = (await this.ask(`${question} (s/n)`, defaultAnswer ? 's' : 'n')).toLowerCase();
    return answer.startsWith('s') || answer.startsWith('y');
  }

  async choose<T extends string>(question: string, options: readonly Option<T>[], defaultValue: T): Promise<T> {
    console.log(question);
    options.forEach((option, index) => console.log(`  ${index + 1}) ${option.label}${option.value === defaultValue ? dim('  (padrão)') : ''}`));
    const answer = await this.ask('Escolha o número', String(options.findIndex((option) => option.value === defaultValue) + 1));
    return options[Number(answer) - 1]?.value ?? defaultValue;
  }

  close(): void {
    this.#terminal?.close();
  }
}

export const step = (number: number, total: number, title: string) => console.log(`\n${bold(`[${number}/${total}] ${title}`)}`);
