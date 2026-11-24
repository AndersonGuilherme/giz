import { z } from 'zod';
import { DIRECOES, POSICOES_NOMEADAS, type Cena } from '../../dominio/roteiro/Cena.ts';
import { esquemasDasCenasDeAula } from './esquemaDasCenasDeAula.ts';
import {
  esquemaDeCamera,
  esquemaDeEfeito,
  esquemaDePonto,
  esquemaDeTextoGrande,
  esquemaDoHud,
} from './esquemaDosElementosDeCena.ts';
import { esquemaDeCor, esquemaDeIdDePersonagem, textoPreenchido } from './refinamentos.ts';

const esquemaDoPersonagemEmCena = z
  .object({
    quem: esquemaDeIdDePersonagem,
    posicao: z.union([z.enum(POSICOES_NOMEADAS), esquemaDePonto]),
    escala: z.number().positive().optional(),
    direcao: z.enum(DIRECOES).optional(),
  })
  .strict();

const esquemaDoFundo = z
  .object({
    imagem: textoPreenchido.optional(),
    vetorial: textoPreenchido.optional(),
    cores: z.record(esquemaDeCor).optional(),
  })
  .strict();

const esquemaDoCenario = z
  .object({
    tipo: z.literal('cenario'),
    fundo: esquemaDoFundo,
    personagens: z.array(esquemaDoPersonagemEmCena),
    camera: esquemaDeCamera.optional(),
    efeitos: z.array(esquemaDeEfeito).optional(),
    hud: esquemaDoHud.optional(),
    destaque: esquemaDeTextoGrande.optional(),
  })
  .strict();

export const esquemaDaCena: z.ZodType<Cena, z.ZodTypeDef, unknown> = z.discriminatedUnion('tipo', [
  esquemaDoCenario,
  ...esquemasDasCenasDeAula,
]);
