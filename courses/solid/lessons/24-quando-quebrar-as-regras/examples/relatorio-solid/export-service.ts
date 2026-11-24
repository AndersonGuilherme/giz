import type { OrderSource, OrderFilter, RowFormatter, Output } from './ports.ts';

export class ExportService {
  private source: OrderSource;
  private filter: OrderFilter;
  private format: RowFormatter;
  private output: Output;
  constructor(source: OrderSource, filter: OrderFilter, format: RowFormatter, output: Output) {
    this.source = source;
    this.filter = filter;
    this.format = format;
    this.output = output;
  }
  run(): void {
    const rows = this.source.load().filter((o) => this.filter.accepts(o)).map((o) => this.format.row(o));
    this.output.write([this.format.header(), ...rows].join('\n'));
  }
}
