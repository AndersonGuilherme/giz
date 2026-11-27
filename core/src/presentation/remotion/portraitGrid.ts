/** The side of each square portrait and how many go in a row. */
export type PortraitGrid = Readonly<{ cell: number; columns: number }>;

/** The picture is exactly as big as its cells: full rows, the last one partial (at least one row). */
export function portraitSheetSize(count: number, { cell, columns }: PortraitGrid): Readonly<{ width: number; height: number }> {
  const rows = Math.max(1, Math.ceil(count / columns));
  return { width: columns * cell, height: rows * cell };
}

/** Where the portrait number `index` is: its top-left corner, in pixels. */
export function portraitCorner(index: number, { cell, columns }: PortraitGrid): Readonly<{ left: number; top: number }> {
  return { left: (index % columns) * cell, top: Math.floor(index / columns) * cell };
}
