import { z } from 'zod';
import { EXPRESSOES } from '../../dominio/elenco/PoseEExpressao.ts';
import { esquemaDeIdDePersonagem, textoPreenchido } from './refinamentos.ts';

/**
 * Os parâmetros só têm o tipo verificado aqui; o catálogo de rigs valida cada um (veja `parametrosDoRig.ts`).
 * O `rig` só é opcional para o narrador (voz sem corpo).
 */
export const esquemaDoPersonagem = z
  .object({
    id: esquemaDeIdDePersonagem,
    nome: textoPreenchido,
    rig: textoPreenchido.optional(),
    parametros: z.record(z.union([z.string(), z.number(), z.boolean()])).default({}),
    voz: z.object({ id: textoPreenchido, estilo: textoPreenchido.optional() }).strict(),
    personalidade: z.string().optional(),
    expressaoPadrao: z.enum(EXPRESSOES),
  })
  .strict();

export type PersonagemJson = z.infer<typeof esquemaDoPersonagem>;
