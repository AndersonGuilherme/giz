// Único ponto de composição: só aqui os adaptadores são criados com `new`.
import { GerarVozes } from '../../aplicacao/casos-de-uso/GerarVozes.ts';
import type { ProvedorVoz } from '../../aplicacao/portas/ProvedorVoz.ts';
import type { RepositorioDeProjeto } from '../../aplicacao/portas/RepositorioDeProjeto.ts';
import type { Projeto } from '../../dominio/projeto/Projeto.ts';
import { ArmazemDeVozesEmDisco } from '../../infraestrutura/disco/ArmazemDeVozesEmDisco.ts';
import { RepositorioDeProjetoEmDisco } from '../../infraestrutura/disco/RepositorioDeProjetoEmDisco.ts';
import { FonetizadorEspeak } from '../../infraestrutura/fonetica/FonetizadorEspeak.ts';
import { CatalogoDeRigsProvisorio } from '../../infraestrutura/rigs/CatalogoDeRigsProvisorio.ts';
import { VozDeArquivo } from '../../infraestrutura/voz/VozDeArquivo.ts';
import { VozQwen } from '../../infraestrutura/voz/VozQwen.ts';

type Provedor = ReturnType<Projeto['voz']>['provedor'];

const PROVEDORES: Readonly<Record<Provedor, (pasta: string, projeto: Projeto) => ProvedorVoz>> = {
  qwen: (_pasta, projeto) => new VozQwen(projeto.voz().modelo),
  arquivo: (pasta) => new VozDeArquivo(pasta),
};

export function repositorioDeProjeto(): RepositorioDeProjeto {
  return new RepositorioDeProjetoEmDisco({ catalogo: new CatalogoDeRigsProvisorio() });
}

export function gerarVozes(pasta: string, projeto: Projeto): GerarVozes {
  const voz = PROVEDORES[projeto.voz().provedor](pasta, projeto);
  return new GerarVozes({ voz, fonetizador: new FonetizadorEspeak(), armazem: new ArmazemDeVozesEmDisco(pasta) });
}
