import { ErroDeDominio } from '../ErroDeDominio.ts';
import type { EfeitoSonoro, Fala } from '../roteiro/Fala.ts';
import type { CenaResolvida, EfeitoSonoroJson, MarcaJson } from './PropsDoVideo.ts';
import type { TemposDaFala } from './TemposDaFala.ts';
import { TextoComMarcas } from './TextoComMarcas.ts';

type Fonte = Readonly<{ texto: TextoComMarcas; pelaPalavra: boolean }>;

// As marcas ficam na pronúncia (se ela tiver colchetes) ou no texto, como no motor. As palavras gravadas
// são as do texto: na pronúncia, a marca cai pela fração do texto falado.
function fonteDasMarcas(fala: Fala): Fonte {
  const pronuncia = fala.pronuncia();
  const naPronuncia = pronuncia !== fala.texto() && TextoComMarcas.temMarcas(pronuncia);
  return { texto: TextoComMarcas.de(naPronuncia ? pronuncia : fala.texto()), pelaPalavra: !naPronuncia };
}

function recusarContagemDiferente(fala: Fala, texto: TextoComMarcas): void {
  const marcas = fala.marcas();
  if (marcas.length === texto.quantidade()) return;
  throw new ErroDeDominio(`fala ${fala.id()}: ${texto.quantidade()} [trechos] no texto, mas ${marcas.length} marca(s)`);
}

function quadrosDasMarcas(fonte: Fonte, tempos: TemposDaFala): number[] {
  const { texto, pelaPalavra } = fonte;
  const palavras = texto.palavrasQueAbrem();
  return texto.fracoes().map((fracao, ordem) => {
    const pelaPalavraGravada = pelaPalavra ? tempos.inicioDaPalavra(palavras[ordem] ?? 0) : undefined;
    return pelaPalavraGravada ?? tempos.quadroNaFracao(fracao);
  });
}

const CAMPOS_DE_PERSONAGEM = new Set(['expressao', 'pose', 'efeitoSonoro']);

/** As marcas de uma fala: o k-ésimo `[trecho]` do texto dispara a k-ésima marca. */
export class Marcas {
  readonly #lista: readonly MarcaJson[];

  private constructor(lista: readonly MarcaJson[]) {
    this.#lista = lista;
  }

  static daFala(fala: Fala, tempos: TemposDaFala): Marcas {
    const fonte = fonteDasMarcas(fala);
    recusarContagemDiferente(fala, fonte.texto);
    const quadros = quadrosDasMarcas(fonte, tempos);
    return new Marcas(fala.marcas().map((marca, ordem) => ({ quadro: quadros[ordem] ?? 0, mudancas: { ...marca } })));
  }

  static deJson(lista: readonly MarcaJson[]): Marcas {
    return new Marcas(lista);
  }

  /** A cena depois de todas as marcas: só os campos de cena (sem expressão, pose e som). */
  aplicadasA(cena: CenaResolvida): CenaResolvida {
    const mudancas = this.#lista.map((marca) => Object.entries(marca.mudancas).filter(([campo]) => !CAMPOS_DE_PERSONAGEM.has(campo)));
    // A marca aceita qualquer campo de cena (como o beat do motor); a validação de cada campo é do esquema.
    return { ...cena, ...Object.fromEntries(mudancas.flat()) } as CenaResolvida;
  }

  /** Os sons das marcas, em quadros absolutos a partir de `inicio`. */
  efeitosSonoros(inicio: number): EfeitoSonoroJson[] {
    return this.#lista.flatMap(({ quadro, mudancas }) => {
      const som = mudancas.efeitoSonoro as EfeitoSonoro | undefined;
      return som ? [{ quadro: inicio + quadro, som }] : [];
    });
  }

  /** O último valor de `campo` dado por uma marca até o quadro relativo `quadro`, e onde ele foi dado. */
  ultimaAte(campo: 'expressao' | 'pose', quadro: number): MarcaJson | undefined {
    const dadas = this.#lista.filter((marca) => marca.quadro <= quadro && marca.mudancas[campo] !== undefined);
    return dadas.at(-1);
  }

  paraJson(): MarcaJson[] {
    return this.#lista.map((marca) => ({ quadro: marca.quadro, mudancas: { ...marca.mudancas } }));
  }
}
