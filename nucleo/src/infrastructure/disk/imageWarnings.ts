import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { linhaDoProblema } from '../../aplicacao/portas/ErroDeProjeto.ts';
import type { FalaJson, RoteiroJson } from '../esquema/esquemaDoRoteiro.ts';

const existe = (caminho: string) => access(caminho).then(() => true, () => false);

async function avisoDaFala(pasta: string, fala: FalaJson, indice: number): Promise<string | undefined> {
  const imagem = fala.cena?.tipo === 'cenario' ? fala.cena.fundo.imagem : undefined;
  if (!imagem || (await existe(join(pasta, imagem)))) return undefined;
  return linhaDoProblema({
    arquivo: 'roteiro.json',
    caminho: `falas[${indice}].cena.fundo.imagem`,
    mensagem: `${imagem} não encontrada (fala ${fala.id}); o render usa o fundo vetorial padrão`,
  });
}

/** Imagens de cenário ausentes não impedem a carga: viram avisos. */
export async function avisosDeImagens(pasta: string, roteiro: RoteiroJson): Promise<string[]> {
  const avisos = await Promise.all(roteiro.falas.map((fala, indice) => avisoDaFala(pasta, fala, indice)));
  return avisos.filter((aviso): aviso is string => aviso !== undefined);
}
