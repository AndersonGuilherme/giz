import type { CenaDeTitulo } from '../roteiro/CenasDeAula.ts';
import type { Proporcao } from '../valores/Proporcao.ts';
import { Caixa } from './Caixa.ts';
import { Caixas } from './Caixas.ts';
import { Fonte } from './Fonte.ts';
import type { RegistroDeLayouts } from './RegistroDeLayouts.ts';

// Constantes de layout das cenas de aula, em pixels do vídeo. Todas ficam dentro da área segura:
// 9:16 → x 86–994, y 250–1498; 16:9 → x 96–1824, y 54–1026. A altura de cada caixa vem da fonte.
type Coluna = Readonly<{ x: number; largura: number }>;
type Posicoes = Readonly<{ coluna: Coluna; sobretitulo: number; titulo: number; subtitulo: number; legenda: Coluna & { base: number } }>;

export const FONTE_LEGENDA = Fonte.de({ familia: 'texto', tamanho: 48, alturaDaLinha: 1.25, maximoDeLinhas: 6 });
export const FONTE_SOBRETITULO = Fonte.de({ familia: 'texto', tamanho: 40, alturaDaLinha: 1.2, maximoDeLinhas: 1 });
export const FONTE_TITULO = Fonte.de({ familia: 'texto', tamanho: 96, alturaDaLinha: 1.1, maximoDeLinhas: 2 });
export const FONTE_SUBTITULO = Fonte.de({ familia: 'texto', tamanho: 48, alturaDaLinha: 1.25, maximoDeLinhas: 2 });

const POSICOES_VERTICAL: Posicoes = {
  coluna: { x: 86, largura: 908 }, sobretitulo: 420, titulo: 492, subtitulo: 727,
  legenda: { x: 86, largura: 908, base: 1498 },
};
const POSICOES_HORIZONTAL: Posicoes = {
  coluna: { x: 96, largura: 1728 }, sobretitulo: 150, titulo: 214, subtitulo: 449,
  legenda: { x: 260, largura: 1400, base: 1026 },
};

const posicoesPara = (proporcao: Proporcao): Posicoes => (proporcao.vertical() ? POSICOES_VERTICAL : POSICOES_HORIZONTAL);

function caixaDeTexto(rotulo: string, local: Coluna & { y: number }, conteudo: { texto: string; fonte: Fonte }): Caixa {
  return Caixa.comTexto(rotulo, { ...local, altura: conteudo.fonte.alturaMaxima() }, conteudo);
}

/** A legenda fica encostada na base da área segura. */
export function caixaDaLegenda(texto: string, proporcao: Proporcao): Caixa {
  const { legenda } = posicoesPara(proporcao);
  const y = legenda.base - FONTE_LEGENDA.alturaMaxima();
  return caixaDeTexto('legenda', { x: legenda.x, largura: legenda.largura, y }, { texto, fonte: FONTE_LEGENDA });
}

function caixasDoTitulo(cena: CenaDeTitulo, proporcao: Proporcao): Caixas {
  const { coluna, ...y } = posicoesPara(proporcao);
  const sobretitulo = caixaDeTexto('sobretítulo', { ...coluna, y: y.sobretitulo }, { texto: cena.sobretitulo, fonte: FONTE_SOBRETITULO });
  const caixas = Caixas.de([sobretitulo, caixaDeTexto('título', { ...coluna, y: y.titulo }, { texto: cena.titulo, fonte: FONTE_TITULO })]);
  if (cena.subtitulo === undefined) return caixas;
  return caixas.com(caixaDeTexto('subtítulo', { ...coluna, y: y.subtitulo }, { texto: cena.subtitulo, fonte: FONTE_SUBTITULO }));
}

/** Por ora só a cena `titulo`; o Task 13 registra as demais cenas de aula. */
export function registrarLayoutsDeAula(registro: RegistroDeLayouts): RegistroDeLayouts {
  return registro.registrar('titulo', caixasDoTitulo);
}
