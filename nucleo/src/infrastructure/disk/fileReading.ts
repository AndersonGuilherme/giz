import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { z } from 'zod';
import type { ProblemCollector } from '../schema/errorMessages.ts';

type Source = Readonly<{ folder: string; file: string; collector: ProblemCollector }>;

function failureReason(error: unknown): string {
  const code = (error as NodeJS.ErrnoException).code;
  return code === 'ENOENT' ? 'arquivo não encontrado' : `não foi possível ler (${String(error)})`;
}

function parsed(text: string, source: Source): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    source.collector.add({ file: source.file, path: '', message: `JSON inválido (${String(error)})` });
    return undefined;
  }
}

async function readJson(source: Source): Promise<unknown> {
  try {
    return parsed(await readFile(join(source.folder, source.file), 'utf8'), source);
  } catch (error) {
    source.collector.add({ file: source.file, path: '', message: failureReason(error) });
    return undefined;
  }
}

/** Reads and validates a JSON file from the project folder; problems go to the collector and the result is `undefined`. */
export async function readValidated<T>(source: Source, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T | undefined> {
  const content = await readJson(source);
  if (content === undefined) return undefined;
  const result = schema.safeParse(content);
  if (result.success) return result.data;
  source.collector.addFromZod(source.file, result.error.issues);
  return undefined;
}
