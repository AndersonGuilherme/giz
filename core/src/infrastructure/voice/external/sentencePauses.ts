// Given the whole line, ElevenLabs shortens the punctuation pauses (measured in the motor: 80–180 ms between
// sentences, and "Primeiro, os nomes. Cada empresa..." came out joined). An explicit pause with the API <break>
// mark: sentence end and colon → `sentence` seconds; comma → `comma` seconds (0 = no mark).
export type Pauses = Readonly<{ sentence: number; comma: number }>;

const breakOf = (seconds: number) => (seconds > 0 ? ` <break time="${seconds}s" /> ` : ' ');

export function withPauses(text: string, { sentence, comma }: Pauses): string {
  const sentences = text.replace(/([.!?…:])\s+(?=\S)/g, (_match, mark: string) => `${mark}${breakOf(sentence)}`);
  const commas = sentences.replace(/,\s+(?=\S)/g, () => `,${breakOf(comma)}`);
  return commas.replace(/\s{2,}/g, ' ').trim();
}
