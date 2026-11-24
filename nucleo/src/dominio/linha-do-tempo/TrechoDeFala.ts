import type { Elenco } from '../elenco/Elenco.ts';
import { Palavras } from '../fala/Palavras.ts';
import type { Fala, PausaDepois } from '../roteiro/Fala.ts';
import { Fps, Segundos } from '../valores/Tempo.ts';
import { efeitosDoTrecho } from './EfeitosSonoros.ts';
import { estadosDaFala } from './EstadosDaFala.ts';
import { Marcas } from './Marcas.ts';
import { pausaDaFala } from './PausaDeLeitura.ts';
import type { CenaResolvida, EfeitoSonoroJson, TrechoJson } from './PropsDoVideo.ts';
import type { CenaDaFala } from './SequenciaDeCenas.ts';
import { TemposDaFala, type VozDaFala } from './TemposDaFala.ts';

export type ContextoDoTrecho = Readonly<{ inicio: number; cena: CenaDaFala; elenco: Elenco }>;

const RESPIRO_EM_SEGUNDOS = 0.35;

const emQuadros = (segundos: number): number => Segundos.de(segundos).emQuadros(Fps.PADRAO).valor();

function duracaoTotal(duracaoDaFala: number, pausa: PausaDepois | undefined): number {
  return duracaoDaFala + Math.round((pausa?.segundos ?? 0) * Fps.PADRAO.valor()) + emQuadros(RESPIRO_EM_SEGUNDOS);
}

// O que a fala tem que só depende dela e da voz gravada.
function daFala(fala: Fala, voz: VozDaFala, cena: CenaDaFala) {
  const quem = fala.quem();
  const palavrasDoRoteiro = Palavras.doTexto(fala.texto());
  const textos = palavrasDoRoteiro.textos();
  const tempos = TemposDaFala.de(voz, textos);
  const pausa = pausaDaFala(fala, cena.aberta ? cena.cena : undefined);
  return { quem: quem.texto(), tempos, palavras: tempos.emQuadros(textos), pausa };
}

/** Uma fala posta na linha do tempo: onde começa, quanto dura, a cena, as marcas e o estado de cada personagem. */
export class TrechoDeFala {
  readonly #json: TrechoJson;
  readonly #efeitos: readonly EfeitoSonoroJson[];

  private constructor(json: TrechoJson, efeitos: readonly EfeitoSonoroJson[]) {
    this.#json = json;
    this.#efeitos = efeitos;
  }

  static montar(fala: Fala, voz: VozDaFala, contexto: ContextoDoTrecho): TrechoDeFala {
    const { quem, tempos, palavras, pausa } = daFala(fala, voz, contexto.cena);
    const marcas = Marcas.daFala(fala, tempos);
    const { cena, chave } = contexto.cena;
    const json: TrechoJson = {
      idFala: fala.id(), quem, inicio: contexto.inicio, duracaoDaFala: tempos.quadros(), duracaoTotal: duracaoTotal(tempos.quadros(), pausa),
      cena, chaveDaCena: chave, palavras, marcas: marcas.paraJson(), estados: estadosDaFala(fala, contexto.elenco, cena),
      audio: voz.arquivo, envelope: [...voz.envelope], visemas: voz.visemas, ...(pausa ? { pausaDepois: pausa } : {}),
    };
    return new TrechoDeFala(json, efeitosDoTrecho(fala, json, contexto.cena));
  }

  /** O quadro (absoluto) em que o trecho seguinte começa. */
  fim(): number {
    return this.#json.inicio + this.#json.duracaoTotal;
  }

  /** A cena com as mudanças das marcas deste trecho, para a fala seguinte que a herdar. */
  cenaDepois(): CenaResolvida {
    const marcas = Marcas.deJson(this.#json.marcas);
    return marcas.aplicadasA(this.#json.cena);
  }

  /** Os sons do trecho, em quadros absolutos. */
  efeitosSonoros(): EfeitoSonoroJson[] {
    return [...this.#efeitos];
  }

  paraJson(): TrechoJson {
    return structuredClone(this.#json);
  }
}
