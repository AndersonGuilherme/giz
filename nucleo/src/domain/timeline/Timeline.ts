import { ErroDeDominio } from '../ErroDeDominio.ts';
import { Corpo } from '../personagem/Corpo.ts';
import { EstadoDoPersonagem } from '../personagem/EstadoDoPersonagem.ts';
import { Piscada } from '../personagem/Piscada.ts';
import type { IdPersonagem } from '../valores/IdPersonagem.ts';
import { Fps, Quadro } from '../valores/Tempo.ts';
import { bocaNoTrecho, estadoNoTrecho, inicioDaPose, type NoTrecho } from './EstadoNoTrecho.ts';
import type { PropsDoVideo, TrechoJson } from './PropsDoVideo.ts';

// Desloca a respiração de cada personagem (pela posição no elenco) para não respirarem juntos.
const FASE_POR_PERSONAGEM = 1.7;
const corpo = new Corpo();

/** A linha do tempo montada (as props do vídeo): o estado de cada personagem em cada quadro. */
export class LinhaDoTempo {
  readonly #props: PropsDoVideo;

  private constructor(props: PropsDoVideo) {
    this.#props = props;
  }

  static de(props: PropsDoVideo): LinhaDoTempo {
    return new LinhaDoTempo(structuredClone(props));
  }

  estadoDe(idPersonagem: IdPersonagem, quadro: Quadro): EstadoDoPersonagem {
    const indice = this.#indiceDoTrecho(quadro);
    const local = this.#local(idPersonagem, indice, quadro);
    const estado = estadoNoTrecho(local);
    if (!estado) throw new ErroDeDominio(`"${local.id}" está sem estado no quadro ${quadro.valor()} (só personagens com corpo têm estado)`);
    const boca = bocaNoTrecho(local);
    const inicio = inicioDaPose(this.#props.trechos, indice, local);
    const contexto = { pose: estado.pose, inicioDaPose: Quadro.de(inicio), falando: boca.falando, abertura: boca.abertura, fase: this.#fase(local.id), fps: Fps.PADRAO };
    const piscada = Piscada.para(local.id);
    return EstadoDoPersonagem.de({
      ...estado, ...boca, piscada: piscada.fechamentoEm(quadro, Fps.PADRAO), corpo: corpo.deslocamentoEm(quadro, contexto),
    });
  }

  // O trecho que contém o quadro; depois do fim, o último.
  #indiceDoTrecho(quadro: Quadro): number {
    const trechos = this.#props.trechos;
    const indice = trechos.findIndex((trecho) => quadro.antesDe(Quadro.de(trecho.inicio + trecho.duracaoTotal)));
    return indice >= 0 ? indice : trechos.length - 1;
  }

  #local(idPersonagem: IdPersonagem, indice: number, quadro: Quadro): NoTrecho {
    const trecho: TrechoJson | undefined = this.#props.trechos[indice];
    if (!trecho) throw new ErroDeDominio('a linha do tempo não tem nenhum trecho');
    return { trecho, id: idPersonagem.texto(), relativo: quadro.valor() - trecho.inicio };
  }

  #fase(id: string): number {
    const posicao = this.#props.elenco.findIndex((personagem) => personagem.id === id);
    return Math.max(0, posicao) * FASE_POR_PERSONAGEM;
  }
}
