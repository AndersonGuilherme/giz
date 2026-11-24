// Único ponto de composição: só aqui os adaptadores são criados com `new`.
import { GerarVozes } from '../../aplicacao/casos-de-uso/GerarVozes.ts';
import { VerificarProjeto } from '../../aplicacao/casos-de-uso/VerificarProjeto.ts';
import type { ProvedorVoz } from '../../aplicacao/portas/ProvedorVoz.ts';
import type { RepositorioDeProjeto } from '../../aplicacao/portas/RepositorioDeProjeto.ts';
import { criarRegistroDeLayouts } from '../../dominio/layout/registroPadrao.ts';
import type { Projeto } from '../../dominio/projeto/Projeto.ts';
import { AlinhadorPorEnvelope } from '../../infraestrutura/alinhamento/AlinhadorPorEnvelope.ts';
import { AlinhadorWhisper } from '../../infraestrutura/alinhamento/AlinhadorWhisper.ts';
import { OuvidoWhisper } from '../../infraestrutura/alinhamento/OuvidoWhisper.ts';
import { ArmazemDeVozesEmDisco } from '../../infraestrutura/disco/ArmazemDeVozesEmDisco.ts';
import { RepositorioDeProjetoEmDisco } from '../../infraestrutura/disco/RepositorioDeProjetoEmDisco.ts';
import { FonetizadorEspeak } from '../../infraestrutura/fonetica/FonetizadorEspeak.ts';
import { VozDeArquivo } from '../../infraestrutura/voz/VozDeArquivo.ts';
import { VozQwen } from '../../infraestrutura/voz/VozQwen.ts';
import { RigCatalogFromRegistry } from '../rigs/RigCatalogFromRegistry.ts';
import { rigRegistry } from '../rigs/rigRegistry.ts';

type Provedor = ReturnType<Projeto['voz']>['provedor'];

const PROVEDORES: Readonly<Record<Provedor, (pasta: string, projeto: Projeto) => ProvedorVoz>> = {
  qwen: (_pasta, projeto) => new VozQwen(projeto.voz().modelo),
  arquivo: (pasta) => new VozDeArquivo(pasta),
};

export function repositorioDeProjeto(): RepositorioDeProjeto {
  return new RepositorioDeProjetoEmDisco({ catalogo: new RigCatalogFromRegistry(rigRegistry) });
}

const avisar = (mensagem: string) => console.log(`AVISO: ${mensagem}`);

export function gerarVozes(pasta: string, projeto: Projeto): GerarVozes {
  const voz = PROVEDORES[projeto.voz().provedor](pasta, projeto);
  const alinhador = new AlinhadorWhisper(new AlinhadorPorEnvelope(), new OuvidoWhisper(), avisar);
  return new GerarVozes({ voz, fonetizador: new FonetizadorEspeak(), armazem: new ArmazemDeVozesEmDisco(pasta), alinhador });
}

export function verificarProjeto(): VerificarProjeto {
  return new VerificarProjeto({ layouts: criarRegistroDeLayouts() });
}
