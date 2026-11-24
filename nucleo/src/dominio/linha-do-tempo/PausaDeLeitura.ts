import type { Cena } from '../roteiro/Cena.ts';
import type { Fala, PausaDepois } from '../roteiro/Fala.ts';

// readingSeconds do motor: ~0,35 s por linha com texto, entre 4 e 9 s, +1 s se houver linhas adicionadas.
const SEGUNDOS_POR_LINHA = 0.35;
const MINIMO_EM_SEGUNDOS = 4;
const MAXIMO_EM_SEGUNDOS = 9;
const ROTULO_DA_LEITURA = 'Leia o código';

function segundosDeLeitura(cena: Cena): number {
  if (cena.tipo !== 'codigo') return 0;
  const comTexto = cena.linhas.filter((linha) => linha.trim()).length;
  const porLinhas = Math.round(comTexto * SEGUNDOS_POR_LINHA);
  const temAdicionadas = (cena.adicionadas?.length ?? 0) > 0;
  return Math.min(MAXIMO_EM_SEGUNDOS, Math.max(MINIMO_EM_SEGUNDOS, porLinhas)) + (temAdicionadas ? 1 : 0);
}

/**
 * A pausa depois da fala: a explícita (`pausaDepois`) e/ou a de leitura de um código que a fala abre na tela;
 * vale a maior. `cenaAberta` é a cena que a fala abre (ausente quando ela herda a anterior).
 */
export function pausaDaFala(fala: Fala, cenaAberta: Cena | undefined): PausaDepois | undefined {
  const leitura = cenaAberta ? segundosDeLeitura(cenaAberta) : 0;
  const explicita = fala.pausaDepois();
  if (explicita) return { ...explicita, segundos: Math.max(explicita.segundos, leitura) };
  if (leitura > 0) return { segundos: leitura, rotulo: ROTULO_DA_LEITURA };
  return undefined;
}
