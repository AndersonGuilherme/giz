import { readFileSync } from 'node:fs';
import type { Order, OrderSource } from './ports.ts';

export class JsonFileOrderSource implements OrderSource {
  private file: string;
  constructor(file: string) { this.file = file; }
  load(): Order[] { return JSON.parse(readFileSync(this.file, 'utf8')); }
}
