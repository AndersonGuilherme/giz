import type { Elenco } from '../../dominio/elenco/Elenco.ts';
import type { Roteiro } from '../../dominio/roteiro/Roteiro.ts';
import { IdPersonagem } from '../../dominio/valores/IdPersonagem.ts';
import type { RoteiroJson } from './esquemaDoRoteiro.ts';
import type { ColetorDeProblemas } from './mensagensDeErro.ts';

const ARQUIVO = 'roteiro.json';

function foraDoElenco(quem: string, elenco: Elenco): string {
  return `"${quem}" não está no elenco (${elenco.ids().join(', ')})`;
}

function problemaDeQuemEstaEmCena(quem: string, elenco: Elenco): string | undefined {
  const id = IdPersonagem.de(quem);
  if (!elenco.contem(id)) return foraDoElenco(quem, elenco);
  return elenco.personagem(id).temCorpo() ? undefined : `${quem} não tem corpo e não pode aparecer em cena`;
}

/** Cada fala precisa ser de alguém do elenco. */
export function verificarQuemFala(roteiro: Roteiro, elenco: Elenco, coletor: ColetorDeProblemas): void {
  const desconhecidos = roteiro.falas().idsDesconhecidos(elenco);
  roteiro.falas().cadaUma().forEach((fala, indice) => {
    const quem = fala.quem().texto();
    if (!desconhecidos.includes(quem)) return;
    coletor.adicionar({ arquivo: ARQUIVO, caminho: `falas[${indice}].quem`, mensagem: foraDoElenco(quem, elenco) });
  });
}

/** Cada personagem posto num cenário precisa ser do elenco e ter corpo. */
export function verificarPersonagensEmCena(json: RoteiroJson, elenco: Elenco, coletor: ColetorDeProblemas): void {
  json.falas.forEach((fala, indiceDaFala) => {
    if (fala.cena?.tipo !== 'cenario') return;
    fala.cena.personagens.forEach(({ quem }, indice) => {
      const mensagem = problemaDeQuemEstaEmCena(quem, elenco);
      const caminho = `falas[${indiceDaFala}].cena.personagens[${indice}].quem`;
      if (mensagem) coletor.adicionar({ arquivo: ARQUIVO, caminho, mensagem });
    });
  });
}
