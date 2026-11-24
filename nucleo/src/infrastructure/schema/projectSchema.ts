import { z } from 'zod';
import { ESTILOS_DE_LEGENDA, FORMATOS, MODELOS_DE_VOZ, PROVEDORES_DE_VOZ } from '../../dominio/projeto/Projeto.ts';
import { Idioma } from '../../dominio/valores/Idioma.ts';
import { Proporcao } from '../../dominio/valores/Proporcao.ts';
import { esquemaDeIdDePersonagem, textoPreenchido, validadoPeloDominio } from './refinamentos.ts';

export const esquemaDoProjeto = z
  .object({
    versao: z.literal(2),
    titulo: textoPreenchido,
    formato: z.enum(FORMATOS),
    idioma: validadoPeloDominio((texto) => Idioma.de(texto)),
    proporcao: validadoPeloDominio((texto) => Proporcao.de(texto)),
    marca: textoPreenchido.optional(),
    estiloDeLegenda: z.enum(ESTILOS_DE_LEGENDA),
    elenco: z.array(esquemaDeIdDePersonagem).min(1),
    voz: z.object({ provedor: z.enum(PROVEDORES_DE_VOZ), modelo: z.enum(MODELOS_DE_VOZ).optional() }).strict(),
  })
  .strict();

export type ProjetoJson = z.infer<typeof esquemaDoProjeto>;
