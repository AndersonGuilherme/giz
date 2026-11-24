import { DomainError } from '../DomainError.ts';

type Size = Readonly<{ width: number; height: number }>;

// More than five cards in a row get too narrow for a whole character on a 1920-wide sheet.
const MOST_PER_ROW = 5;

/** A grid of equal cards that fills an area: as few rows as fit at most five cards each, balanced across rows. */
export class GalleryGrid {
  static for(count: number, area: Size, gap: number): Readonly<{ columns: number; rows: number; card: Size }> {
    if (count < 1) throw new DomainError('galeria vazia: dê pelo menos um personagem');
    const rows = Math.ceil(count / MOST_PER_ROW);
    const columns = Math.ceil(count / rows);
    const card = { width: (area.width - gap * (columns - 1)) / columns, height: (area.height - gap * (rows - 1)) / rows };
    return { columns, rows, card };
  }
}
