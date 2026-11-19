// Quebra a fala em trechos de até ~90 caracteres (fim de frase > vírgula > espaço) para a legenda
// nunca passar de 2 linhas. Cada trecho aparece proporcionalmente à sua posição no texto.
export function captionChunks(text: string, max = 90): Array<{ text: string; at: number }> {
  const out: Array<{ text: string; at: number }> = [];
  let rest = text.trim(), offset = 0;
  while (rest.length) {
    let cut = rest.length;
    if (rest.length > max) {
      const win = rest.slice(0, max + 1);
      const pick = (re: RegExp) => { let best = -1; for (const m of win.matchAll(re)) if (m.index! > max * 0.35) best = m.index! + m[0].length; return best; };
      cut = [pick(/[.!?:]\s/g), pick(/[,;]\s/g), pick(/\s/g)].find((x) => x > 0) ?? max;
    }
    out.push({ text: rest.slice(0, cut).trim(), at: offset / text.length });
    offset += cut; rest = rest.slice(cut).trimStart();
  }
  return out;
}
