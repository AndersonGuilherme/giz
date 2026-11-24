import type { Elenco } from '../elenco/Elenco.ts';
import type { Personagem } from '../elenco/Personagem.ts';
import type { Cena } from '../roteiro/Cena.ts';
import type { Fala, Olhar } from '../roteiro/Fala.ts';
import type { EstadoJson } from './PropsDoVideo.ts';

// Em cena de palco (cenário ou conversa) quem fala olha para o outro; nas cenas de aula, para o conteúdo.
function olharPadraoDeQuemFala(cena: Cena): Olhar {
  return cena.tipo === 'cenario' || cena.tipo === 'conversa' ? 'outro' : 'conteudo';
}

function estadoDeQuemFala(fala: Fala, personagem: Personagem, cena: Cena): EstadoJson {
  return {
    pose: fala.pose() ?? 'neutra',
    expressao: fala.expressao() ?? personagem.expressaoPadrao(),
    olhar: fala.olhar() ?? olharPadraoDeQuemFala(cena),
  };
}

// Quem escuta reage só com o corpo: a reação da fala ou o padrão.
function estadoDeQuemEscuta(fala: Fala, personagem: Personagem): EstadoJson {
  const reacao = fala.reacao() ?? {};
  return { pose: reacao.pose ?? 'neutra', expressao: reacao.expressao ?? personagem.expressaoPadrao(), olhar: reacao.olhar ?? 'outro' };
}

function estadoDe(fala: Fala, personagem: Personagem, cena: Cena): EstadoJson {
  if (personagem.temId(fala.quem())) return estadoDeQuemFala(fala, personagem, cena);
  return estadoDeQuemEscuta(fala, personagem);
}

function idEmTexto(personagem: Personagem): string {
  const id = personagem.id();
  return id.texto();
}

/** Pose, expressão e olhar de cada personagem com corpo durante a fala; o narrador (sem corpo) não entra. */
export function estadosDaFala(fala: Fala, elenco: Elenco, cena: Cena): Record<string, EstadoJson> {
  const comCorpo = elenco.cadaUm().filter((personagem) => personagem.temCorpo());
  return Object.fromEntries(comCorpo.map((personagem) => [idEmTexto(personagem), estadoDe(fala, personagem, cena)]));
}
