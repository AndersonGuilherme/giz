// The automatic ear (`giz qa asr`): how many words Whisper heard differently from the script. Port of the motor's
// scripts/asr-check.ts (norm and wer).
const NUMBER_WORDS = new Set(
  ('zero um uma dois duas tres quatro cinco seis sete oito nove dez onze doze treze quatorze catorze quinze dezesseis ' +
    'dezessete dezoito dezenove vinte trinta quarenta cinquenta sessenta setenta oitenta noventa cem cento duzentos ' +
    'duzentas trezentos quatrocentos quinhentos seiscentos setecentos oitocentos novecentos mil milhao milhoes').split(' '),
);
const NUMBER = '#';
const MONEY_WORDS = new Set(['reais', 'real']);

export type WordErrors = Readonly<{ errors: number; missed: string[] }>;

function plainWords(text: string): string[] {
  const lower = text.toLowerCase();
  const joined = lower.replace(/(\w)-(\w)/g, '$1$2').replace(/r\$/g, ' ').replace(/%/g, ' ');
  const unaccented = joined.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const spaced = unaccented.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
  return spaced.trim().split(' ').filter(Boolean);
}

const asToken = (word: string) => (/^\d+$/.test(word) || NUMBER_WORDS.has(word) ? NUMBER : word);

// "vinte e cinco" is one number, "reais" and the "por" of "por cento" carry no pronunciation to check.
function isFiller(word: string, index: number, words: readonly string[]): boolean {
  const betweenNumbers = word === 'e' && words[index - 1] === NUMBER && words[index + 1] === NUMBER;
  const percent = word === 'por' && words[index + 1] === NUMBER;
  return betweenNumbers || percent || MONEY_WORDS.has(word);
}

/** The words as they are compared: lower case, no accents or punctuation, every number as one `#`. */
export function comparableWords(text: string): string[] {
  const tokens = plainWords(text).map(asToken);
  const meaningful = tokens.filter((word, index) => !isFiller(word, index, tokens));
  return meaningful.filter((word, index) => !(word === NUMBER && meaningful[index - 1] === NUMBER));
}

function distances(reference: readonly string[], heard: readonly string[]): number[][] {
  const table = Array.from({ length: reference.length + 1 }, (_row, row) => [row, ...Array<number>(heard.length).fill(0)]);
  table[0] = [...Array(heard.length + 1).keys()];
  for (let row = 1; row <= reference.length; row++) fillRow(table, { reference, heard, row });
  return table;
}

type RowSource = Readonly<{ reference: readonly string[]; heard: readonly string[]; row: number }>;

function fillRow(table: number[][], { reference, heard, row }: RowSource): void {
  const current = table[row];
  const previous = table[row - 1];
  for (let column = 1; column <= heard.length; column++) {
    const substitution = reference[row - 1] === heard[column - 1] ? 0 : 1;
    current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + substitution);
  }
}

type Walk = Readonly<{ row: number; column: number; missed: readonly string[] }>;
type Words = Readonly<{ reference: readonly string[]; heard: readonly string[] }>;

// One step back along the cheapest path: a match, a wrong word, a missing word, or an extra heard word.
function stepBack(table: number[][], words: Words, { row, column, missed }: Walk): Walk {
  const here = table[row][column];
  const expected = words.reference[row - 1];
  if (expected === words.heard[column - 1]) return { row: row - 1, column: column - 1, missed };
  if (here === table[row - 1][column - 1] + 1) return { row: row - 1, column: column - 1, missed: [...missed, expected] };
  if (here === table[row - 1][column] + 1) return { row: row - 1, column, missed: [...missed, expected] };
  return { row, column: column - 1, missed };
}

/** Word edit distance (the WER numerator) and the reference words that were not heard right. */
export function wordErrors(reference: readonly string[], heard: readonly string[]): WordErrors {
  const table = distances(reference, heard);
  let walk: Walk = { row: reference.length, column: heard.length, missed: [] };
  while (walk.row > 0 && walk.column > 0) walk = stepBack(table, { reference, heard }, walk);
  const unheard = reference.slice(0, walk.row).reverse();
  return { errors: table[reference.length][heard.length], missed: [...walk.missed, ...unheard] };
}
