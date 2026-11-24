import type { Expressao, Pose } from '../elenco/PoseEExpressao.ts';
import type { Visema } from '../fala/Visemas.ts';
import type { Olhar } from '../roteiro/Fala.ts';
import type { DeslocamentoDoCorpo } from './Corpo.ts';

export type DadosDoEstado = Readonly<{
  pose: Pose;
  expressao: Expressao;
  olhar: Olhar;
  falando: boolean;
  visema: Visema;
  abertura: number; // volume da fala, de 0 a 1
  piscada: number; // fechamento dos olhos, de 0 a 1
  corpo: DeslocamentoDoCorpo;
}>;

/** Tudo o que define como um personagem aparece num quadro; o Task 9 monta com `EstadoDoPersonagem.no(...)`. */
export class EstadoDoPersonagem {
  readonly #dados: DadosDoEstado;

  private constructor(dados: DadosDoEstado) {
    this.#dados = dados;
  }

  static de(dados: DadosDoEstado): EstadoDoPersonagem {
    return new EstadoDoPersonagem(dados);
  }

  pose(): Pose {
    return this.#dados.pose;
  }

  expressao(): Expressao {
    return this.#dados.expressao;
  }

  olhaPara(): Olhar {
    return this.#dados.olhar;
  }

  estaFalando(): boolean {
    return this.#dados.falando;
  }

  visema(): Visema {
    return this.#dados.visema;
  }

  abertura(): number {
    return this.#dados.abertura;
  }

  fechamentoDosOlhos(): number {
    return this.#dados.piscada;
  }

  deslocamentoDoCorpo(): DeslocamentoDoCorpo {
    return this.#dados.corpo;
  }
}
