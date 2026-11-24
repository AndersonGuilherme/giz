import { createRequire } from 'node:module';
import type { Fonetizador } from '../../aplicacao/portas/Fonetizador.ts';
import type { Idioma } from '../../dominio/valores/Idioma.ts';
import { normalizarGeral, normalizarPtBr } from './normalizacao.ts';

type TrabalhadorEspeak = { set_voice(voz: string): void; synthesize_ipa(texto: string): { ipa: string } };

const NORMALIZADORES: Readonly<Record<string, (ipa: string) => string>> = {
  'pt-BR': normalizarPtBr,
  en: normalizarGeral,
};

// O espeak é carregado (WASM) uma vez por processo e reaproveitado por todas as instâncias.
let trabalhador: Promise<TrabalhadorEspeak> | undefined;

async function carregarEspeak(): Promise<TrabalhadorEspeak> {
  const requisitar = createRequire(import.meta.url);
  const fabrica = (await import(requisitar.resolve('@echogarden/espeak-ng-emscripten'))).default;
  return new (await fabrica()).eSpeakNGWorker() as TrabalhadorEspeak;
}

// O trabalhador tem uma voz ativa só: as chamadas entram numa fila para não trocar a voz no meio de outra.
let fila: Promise<unknown> = Promise.resolve();

export class FonetizadorEspeak implements Fonetizador {
  ipa(texto: string, idioma: Idioma): Promise<string> {
    const resultado = fila.then(() => this.#fonetizar(texto, idioma));
    fila = resultado.catch(() => undefined);
    return resultado;
  }

  async #fonetizar(texto: string, idioma: Idioma): Promise<string> {
    trabalhador ??= carregarEspeak();
    const espeak = await trabalhador;
    espeak.set_voice(idioma.vozEspeak());
    const normalizar = NORMALIZADORES[idioma.codigo()] ?? normalizarGeral;
    const trechos = [...texto.matchAll(/([^,.;:!?…]+)([,.;:!?…]*)/g)];
    const fonetizarTrecho = (palavras: string): string => {
      const linhas = espeak.synthesize_ipa(palavras).ipa.split('\n').filter(Boolean);
      return normalizar(linhas.map((linha) => linha.replace(/_/g, '')).join(' '));
    };
    return trechos
      .map(([, palavras, pontuacao]) => this.#trecho(fonetizarTrecho, palavras!.trim(), pontuacao!))
      .filter(Boolean)
      .join(' ');
  }

  #trecho(fonetizar: (palavras: string) => string, palavras: string, pontuacao: string): string {
    if (!palavras) return '';
    return fonetizar(palavras) + pontuacao.replace('…', '...').slice(0, 3);
  }
}
