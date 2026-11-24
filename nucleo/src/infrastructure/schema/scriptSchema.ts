import { z } from 'zod';
import { EXPRESSOES, POSES } from '../../dominio/elenco/PoseEExpressao.ts';
import { EFEITOS_SONOROS, OLHARES } from '../../dominio/roteiro/Fala.ts';
import { esquemaDaCena } from './esquemaDaCena.ts';
import { esquemaDeIdDePersonagem, textoPreenchido } from './refinamentos.ts';

const pose = z.enum(POSES);
const expressao = z.enum(EXPRESSOES);
const olhar = z.enum(OLHARES);
const efeitoSonoro = z.enum(EFEITOS_SONOROS);

const esquemaDaReacao = z
  .object({ expressao: expressao.optional(), pose: pose.optional(), olhar: olhar.optional() })
  .strict();

const esquemaDaMarca = z
  .object({ expressao: expressao.optional(), pose: pose.optional(), efeitoSonoro: efeitoSonoro.optional() })
  .passthrough();

const esquemaDaPausa = z.object({ segundos: z.number().positive(), rotulo: z.string() }).strict();

export const esquemaDaFala = z
  .object({
    id: textoPreenchido,
    capitulo: z.number().int().min(1),
    quem: esquemaDeIdDePersonagem,
    texto: textoPreenchido,
    pronuncia: textoPreenchido.optional(),
    pose: pose.optional(),
    expressao: expressao.optional(),
    olhar: olhar.optional(),
    reacao: esquemaDaReacao.optional(),
    cena: esquemaDaCena.optional(),
    marcas: z.array(esquemaDaMarca).optional(),
    pausaDepois: esquemaDaPausa.optional(),
    efeitoSonoro: efeitoSonoro.optional(),
  })
  .strict();

export type FalaJson = z.infer<typeof esquemaDaFala>;

type RoteiroBruto = { capitulos: string[]; falas: FalaJson[] };

function capitulosExistentes(roteiro: RoteiroBruto, contexto: z.RefinementCtx): void {
  const total = roteiro.capitulos.length;
  roteiro.falas.forEach((fala, indice) => {
    if (fala.capitulo <= total) return;
    const message = `capítulo ${fala.capitulo} não existe (há ${total})`;
    contexto.addIssue({ code: z.ZodIssueCode.custom, path: ['falas', indice, 'capitulo'], message });
  });
}

function idsUnicos(roteiro: RoteiroBruto, contexto: z.RefinementCtx): void {
  roteiro.falas.forEach((fala, indice) => {
    if (roteiro.falas.findIndex((outra) => outra.id === fala.id) === indice) return;
    contexto.addIssue({ code: z.ZodIssueCode.custom, path: ['falas', indice, 'id'], message: `id "${fala.id}" repetido` });
  });
}

export const esquemaDoRoteiro = z
  .object({ capitulos: z.array(textoPreenchido).min(1), falas: z.array(esquemaDaFala).min(1) })
  .strict()
  .superRefine(capitulosExistentes)
  .superRefine(idsUnicos);

export type RoteiroJson = z.infer<typeof esquemaDoRoteiro>;
