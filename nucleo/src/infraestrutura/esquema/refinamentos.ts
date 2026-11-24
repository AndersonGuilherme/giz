import { z } from 'zod';
import { ErroDeDominio } from '../../dominio/ErroDeDominio.ts';
import { CorHex } from '../../dominio/valores/CorHex.ts';
import { IdPersonagem } from '../../dominio/valores/IdPersonagem.ts';

function mensagemDoErro(erro: unknown): string {
  if (!(erro instanceof ErroDeDominio)) throw erro;
  return erro.message;
}

/** Roda a fábrica do domínio e devolve a mensagem do `ErroDeDominio`, se houver. */
export function mensagemDoDominio(fabrica: () => unknown): string | undefined {
  try {
    fabrica();
    return undefined;
  } catch (erro) {
    return mensagemDoErro(erro);
  }
}

/** Um texto que a fábrica do domínio aceita; a mensagem de recusa é a do próprio domínio. */
export function validadoPeloDominio(fabrica: (texto: string) => unknown) {
  return z.string().superRefine((texto, contexto) => {
    const mensagem = mensagemDoDominio(() => fabrica(texto));
    if (mensagem) contexto.addIssue({ code: z.ZodIssueCode.custom, message: mensagem });
  });
}

export const esquemaDeCor = validadoPeloDominio((texto) => CorHex.de(texto));
export const esquemaDeIdDePersonagem = validadoPeloDominio((texto) => IdPersonagem.de(texto));
export const textoPreenchido = z.string().min(1);
