import { z } from 'zod';
import {
  CURVAS_DE_GRAFICO,
  TONS_DE_NO,
  TONS_DE_TERMINAL,
  VARIANTES_DE_CARTAO,
} from '../../dominio/roteiro/CenasDeAula.ts';
import { textoPreenchido } from './refinamentos.ts';

const indice = z.number().int().min(0);
const lado = z.object({ titulo: z.string(), texto: z.string() }).strict();

const titulo = z
  .object({ tipo: z.literal('titulo'), sobretitulo: z.string(), titulo: textoPreenchido, subtitulo: z.string().optional() })
  .strict();
const cartao = z
  .object({
    tipo: z.literal('cartao'),
    variante: z.enum(VARIANTES_DE_CARTAO),
    titulo: z.string(),
    itens: z.array(z.string()),
    mostrados: indice.optional(),
  })
  .strict();
const citacao = z.object({ tipo: z.literal('citacao'), texto: textoPreenchido }).strict();
const grafico = z
  .object({
    tipo: z.literal('grafico'),
    rotuloDoEixoX: z.string(),
    rotuloDoEixoY: z.string(),
    curvas: z.array(z.enum(CURVAS_DE_GRAFICO)),
  })
  .strict();
const sintomas = z
  .object({
    tipo: z.literal('sintomas'),
    itens: z.array(z.object({ nome: z.string(), descricao: z.string() }).strict()),
    mostrados: indice,
    foco: indice.optional(),
  })
  .strict();
const codigo = z
  .object({
    tipo: z.literal('codigo'),
    titulo: z.string(),
    linhas: z.array(z.string()),
    adicionadas: z.array(indice).optional(),
    destaque: z.array(textoPreenchido).optional(),
  })
  .strict();
const terminal = z
  .object({
    tipo: z.literal('terminal'),
    comando: z.string(),
    linhas: z.array(z.object({ texto: z.string(), tom: z.enum(TONS_DE_TERMINAL).optional() }).strict()),
  })
  .strict();
const no = z
  .object({ id: textoPreenchido, rotulo: z.string(), x: z.number(), y: z.number(), tom: z.enum(TONS_DE_NO).optional() })
  .strict();
const aresta = z.object({ de: textoPreenchido, para: textoPreenchido, ruim: z.boolean().optional() }).strict();
const grafo = z
  .object({ tipo: z.literal('grafo'), nos: z.array(no), arestas: z.array(aresta), focoNasRuins: z.boolean().optional() })
  .strict();
const versus = z.object({ tipo: z.literal('versus'), errado: lado, certo: lado }).strict();
const tabela = z
  .object({
    tipo: z.literal('tabela'),
    titulo: z.string().optional(),
    colunas: z.array(z.string()),
    linhas: z.array(z.object({ rotulo: z.string(), celulas: z.array(z.string()) }).strict()),
    linhasMostradas: indice.optional(),
    colunaDestacada: indice.optional(),
    linhaDestacada: indice.optional(),
  })
  .strict();
const conversa = z.object({ tipo: z.literal('conversa') }).strict();

export const esquemasDasCenasDeAula = [
  titulo, cartao, citacao, grafico, sintomas, codigo, terminal, grafo, versus, tabela, conversa,
] as const;
