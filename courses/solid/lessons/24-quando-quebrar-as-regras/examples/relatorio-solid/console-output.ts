import type { Output } from './ports.ts';

export class ConsoleOutput implements Output {
  write(text: string): void { console.log(text); }
}
