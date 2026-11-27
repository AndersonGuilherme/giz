import { createContext, useContext } from 'react';
import type { LineFolding } from '../../state/useLineFolding.ts';

/** The open lines, plus `show`: select a line, open it and scroll to it (a check's jump, a line named by the Video stage). */
export type FoldingTools = LineFolding & Readonly<{ show: (index: number) => void }>;

export const FoldingContext = createContext<FoldingTools | null>(null);

export function useFolding(): FoldingTools {
  const folding = useContext(FoldingContext);
  if (!folding) throw new Error('useFolding outside the editor');
  return folding;
}
