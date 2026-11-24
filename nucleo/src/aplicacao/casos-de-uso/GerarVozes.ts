import { Audio } from '../../dominio/fala/Audio.ts';
import { Envelope } from '../../dominio/fala/Envelope.ts';
import { MapaDeVisemas } from '../../dominio/fala/Visemas.ts';
import type { Projeto } from '../../dominio/projeto/Projeto.ts';
import type { Fala } from '../../dominio/roteiro/Fala.ts';
import { Fps } from '../../dominio/valores/Tempo.ts';
import { arquivoDaVoz, type ArmazemDeVozes } from '../portas/ArmazemDeVozes.ts';
import type { Fonetizador } from '../portas/Fonetizador.ts';
import type { PedidoDeVoz, ProvedorVoz } from '../portas/ProvedorVoz.ts';

export type Progresso = Readonly<{ feitas: number; total: number; idFala: string; gerada: boolean }>;
export type RelatorioDeVozes = { geradas: string[]; puladas: string[] };
type Dependencias = Readonly<{ voz: ProvedorVoz; fonetizador: Fonetizador; armazem: ArmazemDeVozes }>;

const nadaAFazer = () => undefined;

// Web Crypto (global do Node e dos navegadores): a aplicação não importa node:crypto.
async function sha1(texto: string): Promise<string> {
  const resumo = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(texto));
  return [...new Uint8Array(resumo)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function pedidoDaFala(projeto: Projeto, fala: Fala): PedidoDeVoz {
  const elenco = projeto.elenco();
  const personagem = elenco.personagem(fala.quem());
  const { id, estilo } = personagem.voz();
  return { idFala: fala.id(), texto: fala.pronuncia(), voz: id, estilo, idioma: projeto.idioma() };
}

// Mudar qualquer um destes campos regrava a fala; o resto (pose, cena...) não mexe na voz.
function hashDaFala(projeto: Projeto, fala: Fala, pedido: PedidoDeVoz): Promise<string> {
  const { provedor } = projeto.voz();
  const idioma = pedido.idioma;
  return sha1([fala.texto(), pedido.texto, pedido.voz, pedido.estilo ?? '', idioma.codigo(), provedor].join('|'));
}

/** Gera a voz, o envelope e os visemas de cada fala; falas com o mesmo hash já gravado são puladas. */
export class GerarVozes {
  readonly #dependencias: Dependencias;

  constructor(dependencias: Dependencias) {
    this.#dependencias = dependencias;
  }

  async executar(projeto: Projeto, aoProgredir: (progresso: Progresso) => void = nadaAFazer): Promise<RelatorioDeVozes> {
    const roteiro = projeto.roteiro();
    const todas = roteiro.falas();
    const falas = todas.cadaUma();
    const relatorio: RelatorioDeVozes = { geradas: [], puladas: [] };
    for (const [indice, fala] of falas.entries()) {
      const gerada = await this.#processar(projeto, fala);
      (gerada ? relatorio.geradas : relatorio.puladas).push(fala.id());
      aoProgredir({ feitas: indice + 1, total: falas.length, idFala: fala.id(), gerada });
    }
    return relatorio;
  }

  async #processar(projeto: Projeto, fala: Fala): Promise<boolean> {
    const pedido = pedidoDaFala(projeto, fala);
    const hash = await hashDaFala(projeto, fala, pedido);
    const { armazem } = this.#dependencias;
    if (armazem.hashGravado(fala.id()) === hash) return false;
    await this.#gravar(pedido, hash);
    return true;
  }

  async #gravar(pedido: PedidoDeVoz, hash: string): Promise<void> {
    const { voz, armazem } = this.#dependencias;
    const audio = tratado(await voz.gerar(pedido));
    const envelope = Envelope.medir(audio, Fps.PADRAO);
    const visemas = await this.#visemas(pedido, envelope);
    const duracao = audio.duracao();
    const registro = { arquivo: arquivoDaVoz(pedido.idFala), hash, duracaoSegundos: duracao.valor(), envelope: envelope.paraJson(), visemas };
    await armazem.gravar(pedido.idFala, registro, audio);
  }

  async #visemas(pedido: PedidoDeVoz, envelope: Envelope): Promise<string> {
    const { fonetizador } = this.#dependencias;
    const ipa = await fonetizador.ipa(pedido.texto, pedido.idioma);
    const mapa = MapaDeVisemas.para(pedido.idioma);
    const sequencia = mapa.converter(ipa);
    return sequencia.espalharSobre(envelope.quadrosComVoz());
  }
}

function tratado(bruto: Audio): Audio {
  const aparado = bruto.aparado();
  return aparado.normalizado();
}
