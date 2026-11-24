// In pt-br, espeak returns the mnemonics 'æ' (unstressed final a) and 'y' (unstressed final e): in IPA they are ɐ and ɪ.
// Only for pt-BR: in English 'æ' is a real vowel.
export function normalizePtBr(ipa: string): string {
  return normalizeGeneral(ipa.replace(/æ/g, 'ɐ').replace(/y/g, 'ɪ'));
}

export function normalizeGeneral(ipa: string): string {
  return ipa
    .replace(/t͡ʃ|tʃ/g, 'ʧ').replace(/d͡ʒ|dʒ/g, 'ʤ').replace(/t͡s/g, 'ʦ').replace(/d͡z/g, 'ʣ')
    .replace(/ʲ/g, 'j').replace(/[͜͡]/g, '').replace(/\s+/g, ' ').trim();
}
