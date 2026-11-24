// No pt-br, o espeak devolve os mnemônicos 'æ' (a final átono) e 'y' (e final átono): em IPA são ɐ e ɪ.
// Só vale para o pt-BR: no inglês o 'æ' é uma vogal de verdade.
export function normalizarPtBr(ipa: string): string {
  return normalizarGeral(ipa.replace(/æ/g, 'ɐ').replace(/y/g, 'ɪ'));
}

export function normalizarGeral(ipa: string): string {
  return ipa
    .replace(/t͡ʃ|tʃ/g, 'ʧ').replace(/d͡ʒ|dʒ/g, 'ʤ').replace(/t͡s/g, 'ʦ').replace(/d͡z/g, 'ʣ')
    .replace(/ʲ/g, 'j').replace(/[͜͡]/g, '').replace(/\s+/g, ' ').trim();
}
