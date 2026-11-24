// Comparação de palavras ouvidas com as do roteiro: sem acento, sem pontuação e em minúsculas.

/** "Olá," → "ola"; "pull-request" → "pullrequest". */
export function normalizar(texto: string): string {
  const semAcento = texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return semAcento.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

const em = (lista: readonly number[], indice: number) => lista[indice] ?? 0;

// Uma linha da tabela de Levenshtein, a partir da anterior.
function proximaLinha(anterior: readonly number[], letra: string, outro: string): number[] {
  const linha = [em(anterior, 0) + 1];
  for (let coluna = 1; coluna <= outro.length; coluna++) {
    const troca = em(anterior, coluna - 1) + (outro[coluna - 1] === letra ? 0 : 1);
    linha.push(Math.min(em(anterior, coluna) + 1, em(linha, coluna - 1) + 1, troca));
  }
  return linha;
}

function distancia(um: string, outro: string): number {
  const primeira = [...Array(outro.length + 1).keys()];
  const ultima = [...um].reduce((linha, letra) => proximaLinha(linha, letra, outro), primeira);
  return ultima[outro.length] ?? 0;
}

/** De 0 (nada em comum) a 1 (iguais), pela distância de edição entre as letras. */
export function semelhanca(um: string, outro: string): number {
  const maior = Math.max(um.length, outro.length);
  return maior === 0 ? 1 : 1 - distancia(um, outro) / maior;
}
