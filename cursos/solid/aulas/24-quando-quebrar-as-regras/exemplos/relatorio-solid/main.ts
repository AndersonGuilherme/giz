// Raiz de composição. Uso: node relatorio-solid/main.ts pedidos.json 2026-11-27
import { ExportService } from './export-service.ts';
import { JsonFileOrderSource } from './json-source.ts';
import { DayFilter } from './day-filter.ts';
import { CsvFormatter } from './csv-formatter.ts';
import { ConsoleOutput } from './console-output.ts';

const [file, day] = process.argv.slice(2);
new ExportService(new JsonFileOrderSource(file), new DayFilter(day), new CsvFormatter(), new ConsoleOutput()).run();
