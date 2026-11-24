import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { SpellingTest } from '../composition/qa.ts';
import { UsageError } from '../usage.ts';

// `giz qa <tool>`: the quality tools of the motor (asr-check, asr-aggregate, pitch-check, voice-lab, lexicon-lab).
type Tool = (args: readonly string[]) => Promise<void>;

const USAGE = `uso: giz qa asr <pasta-do-projeto>
       giz qa asr-aggregate <pasta-com-os-projetos>
       giz qa pitch <pasta-do-projeto>
       giz qa voices [pasta-de-saida] [voz1,voz2,...] ["instrução de estilo (só 1.7B)"]
       giz qa lexicon [testes.json] [voz]   (testes: [{"word":"deploy","frame":"Fiz o X ontem.","candidates":["deploy","diplói"]}])`;

const qa = async () => (await import('../composition/qa.ts')).qa;
const print = (rows: readonly string[]) => rows.forEach((row) => console.log(row));

function folderOf(folder: string | undefined): string {
  if (!folder) throw new UsageError(USAGE);
  return resolve(folder);
}

// The tests come from a JSON file, or from LAB_TESTS (as in the motor); without either, the e-mails example.
async function spellingTests(file: string | undefined): Promise<SpellingTest[] | undefined> {
  if (file) return JSON.parse(await readFile(file, 'utf8')) as SpellingTest[];
  return process.env.LAB_TESTS ? (JSON.parse(process.env.LAB_TESTS) as SpellingTest[]) : undefined;
}

const TOOLS: Readonly<Record<string, Tool>> = {
  asr: async ([folder]) => print(await (await qa()).asr(folderOf(folder))),
  'asr-aggregate': async ([folder]) => print((await qa()).aggregate(folderOf(folder))),
  pitch: async ([folder]) => print(await (await qa()).pitch(folderOf(folder))),
  voices: async ([output = 'vozes', voices, instruct]) => (await qa()).voices(resolve(output), { voices: voices?.split(','), instruct: instruct || undefined }, console.log),
  lexicon: async ([file, voice]) => (await qa()).lexicon(await spellingTests(file), voice ?? process.env.LAB_VOICE ?? 'vivian', console.log),
};

export async function qaCommand([name = '', ...args]: readonly string[]): Promise<void> {
  const tool = TOOLS[name];
  if (!tool) throw new UsageError(USAGE);
  await tool(args);
}
