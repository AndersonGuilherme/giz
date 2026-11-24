import { z } from 'zod';
import {
  ENTRADAS_DE_TEXTO,
  SUAVIDADES,
  TIPOS_DE_EFEITO,
  TIPOS_DE_MOVIMENTO,
} from '../../dominio/roteiro/ElementosDeCena.ts';
import { esquemaDeCor, textoPreenchido } from './refinamentos.ts';

export const esquemaDePonto = z.object({ x: z.number(), y: z.number() }).strict();

const esquemaDeEnquadramento = z.object({ x: z.number(), y: z.number(), zoom: z.number().positive() }).strict();

export const esquemaDeCamera = z
  .object({
    tipo: z.enum(TIPOS_DE_MOVIMENTO),
    de: esquemaDeEnquadramento.optional(),
    para: esquemaDeEnquadramento.optional(),
    alvo: textoPreenchido.optional(),
    intensidade: z.number().min(0).optional(),
    suavidade: z.enum(SUAVIDADES).optional(),
  })
  .strict();

export const esquemaDeEfeito = z
  .object({
    tipo: z.enum(TIPOS_DE_EFEITO),
    intensidade: z.number().min(0).optional(),
    cor: esquemaDeCor.optional(),
    posicao: esquemaDePonto.optional(),
  })
  .strict();

export const esquemaDoHud = z
  .object({
    campos: z.array(z.object({ rotulo: z.string(), valor: z.string() }).strict()),
    barra: z.object({ rotulo: z.string(), valor: z.number().min(0).max(100) }).strict().optional(),
  })
  .strict();

export const esquemaDeTextoGrande = z
  .object({ texto: textoPreenchido, cor: esquemaDeCor.optional(), entrada: z.enum(ENTRADAS_DE_TEXTO).optional() })
  .strict();
