import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { MovimentoDeCameraJson } from '../roteiro/ElementosDeCena.ts';
import type { Quadro } from '../valores/Tempo.ts';
import type { Enquadramento } from './Enquadramento.ts';
import { REGISTRO_DE_MOVIMENTOS, type TipoDeMovimento } from './TiposDeMovimento.ts';

export class MovimentoDeCamera {
  readonly #tipo: TipoDeMovimento;

  private constructor(tipo: TipoDeMovimento) {
    this.#tipo = tipo;
  }

  static de(json: MovimentoDeCameraJson): MovimentoDeCamera {
    const construtor = REGISTRO_DE_MOVIMENTOS.get(json.tipo);
    if (!construtor) {
      const validos = [...REGISTRO_DE_MOVIMENTOS.keys()].join(', ');
      throw new ErroDeDominio(`tipo de câmera "${json.tipo}" desconhecido (tipos válidos: ${validos})`);
    }
    return new MovimentoDeCamera(new construtor(json));
  }

  /** `progresso` de 0 a 1 ao longo da cena. */
  enquadramentoEm(progresso: number, quadro: Quadro): Enquadramento {
    return this.#tipo.enquadramentoEm(progresso, quadro);
  }
}
