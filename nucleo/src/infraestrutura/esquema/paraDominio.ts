import { Personagem, type ValorDeParametro } from '../../dominio/elenco/Personagem.ts';
import { type ConteudoDoProjeto, Projeto } from '../../dominio/projeto/Projeto.ts';
import { Fala } from '../../dominio/roteiro/Fala.ts';
import { Falas } from '../../dominio/roteiro/Falas.ts';
import { Roteiro } from '../../dominio/roteiro/Roteiro.ts';
import { IdPersonagem } from '../../dominio/valores/IdPersonagem.ts';
import { Idioma } from '../../dominio/valores/Idioma.ts';
import { Proporcao } from '../../dominio/valores/Proporcao.ts';
import type { PersonagemJson } from './esquemaDoPersonagem.ts';
import type { ProjetoJson } from './esquemaDoProjeto.ts';
import type { FalaJson, RoteiroJson } from './esquemaDoRoteiro.ts';

/** Conversões de JSON já validado para o domínio: uma função por entidade. */
export function personagemParaDominio(json: PersonagemJson, parametros: Record<string, ValorDeParametro>): Personagem {
  const { id, ...ficha } = json;
  return Personagem.de(IdPersonagem.de(id), { ...ficha, parametros });
}

export function falaParaDominio(json: FalaJson): Fala {
  const { quem, ...dados } = json;
  return Fala.de(IdPersonagem.de(quem), dados);
}

export function roteiroParaDominio(json: RoteiroJson): Roteiro {
  return Roteiro.de(json.capitulos, Falas.de(json.falas.map(falaParaDominio)));
}

export function projetoParaDominio(json: ProjetoJson, conteudo: ConteudoDoProjeto): Projeto {
  const ficha = {
    titulo: json.titulo,
    formato: json.formato,
    idioma: Idioma.de(json.idioma),
    proporcao: Proporcao.de(json.proporcao),
    marca: json.marca,
    estiloDeLegenda: json.estiloDeLegenda,
    voz: json.voz,
  };
  return Projeto.de(ficha, conteudo);
}
