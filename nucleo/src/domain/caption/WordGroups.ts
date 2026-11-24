import type { Font } from '../layout/Font.ts';
import { TextFit, type Fit } from '../layout/TextFit.ts';

/** A group of words shown together: `first` is the index of its first word in the line. */
export type WordGroup = Readonly<{ first: number; texts: readonly string[]; fit: Fit }>;
export type GroupRule = Readonly<{ font: Font; width: number; maximumWords: number }>;

// A word that ends a sentence or a clause closes its group, as in "DOENÇA." of the reference videos.
const CLOSES_GROUP = /[.,!?;:…]["'”’)]*$/;

function joins(group: readonly string[], word: string, rule: GroupRule): boolean {
  const last = group.at(-1);
  if (last === undefined) return true;
  if (group.length >= rule.maximumWords || CLOSES_GROUP.test(last)) return false;
  const fit = TextFit.measure([...group, word].join(' '), rule.font, rule.width);
  return fit.fits && fit.size === rule.font.baseSize();
}

// Grows a group while the next word still fits on one line at the base size; a word alone always opens a group.
function textGroups(texts: readonly string[], rule: GroupRule): string[][] {
  return texts.reduce<string[][]>((groups, word) => {
    const current = groups.at(-1) ?? [];
    if (groups.length > 0 && joins(current, word, rule)) return [...groups.slice(0, -1), [...current, word]];
    return [...groups, [word]];
  }, []);
}

/** Splits the words of a line into groups that each fit one line (shrinking only a word that is alone). */
export function wordGroups(texts: readonly string[], rule: GroupRule): WordGroup[] {
  const groups = textGroups(texts, rule);
  const firsts = groups.map((_group, index) => groups.slice(0, index).reduce((sum, previous) => sum + previous.length, 0));
  return groups.map((group, index) => ({ first: firsts[index], texts: group, fit: TextFit.measure(group.join(' '), rule.font, rule.width) }));
}
