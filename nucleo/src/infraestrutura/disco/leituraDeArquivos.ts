import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { z } from 'zod';
import type { ColetorDeProblemas } from '../esquema/mensagensDeErro.ts';

type Origem = Readonly<{ pasta: string; arquivo: string; coletor: ColetorDeProblemas }>;

function motivoDaFalha(erro: unknown): string {
  const codigo = (erro as NodeJS.ErrnoException).code;
  return codigo === 'ENOENT' ? 'arquivo não encontrado' : `não foi possível ler (${String(erro)})`;
}

function interpretado(texto: string, origem: Origem): unknown {
  try {
    return JSON.parse(texto);
  } catch (erro) {
    origem.coletor.adicionar({ arquivo: origem.arquivo, caminho: '', mensagem: `JSON inválido (${String(erro)})` });
    return undefined;
  }
}

async function lerJson(origem: Origem): Promise<unknown> {
  try {
    return interpretado(await readFile(join(origem.pasta, origem.arquivo), 'utf8'), origem);
  } catch (erro) {
    origem.coletor.adicionar({ arquivo: origem.arquivo, caminho: '', mensagem: motivoDaFalha(erro) });
    return undefined;
  }
}

/** Lê e valida um JSON da pasta do projeto; os problemas vão para o coletor e o retorno fica `undefined`. */
export async function lerValidado<T>(origem: Origem, esquema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T | undefined> {
  const conteudo = await lerJson(origem);
  if (conteudo === undefined) return undefined;
  const resultado = esquema.safeParse(conteudo);
  if (resultado.success) return resultado.data;
  origem.coletor.adicionarDoZod(origem.arquivo, resultado.error.issues);
  return undefined;
}
