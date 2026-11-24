import type { TokenKind } from '../../../domain/code/Tokens.ts';

// The motor's code palette (`THEME.code`): a dark window with Dracula-like token colors.
export const CODE_COLORS = {
  background: '#1B1530', bar: '#251D40', chip: '#E8E2FF', lineNumber: '#5E5582', added: '#28C840',
  addedRow: 'rgba(40,200,64,.16)', highlightRow: (strength: number) => `rgba(232,23,223,${0.28 * strength})`,
} as const;

export const WINDOW_DOTS = ['#FF5F57', '#FEBC2E', '#28C840'] as const;

/** The color of each token kind. */
export const TOKEN_COLORS: Readonly<Record<TokenKind, string>> = {
  keyword: '#FF79C6',
  type: '#8BE9FD',
  function: '#C9A7FF',
  string: '#A5E3A0',
  number: '#FFB86C',
  comment: '#7F75A3',
  space: '#E8E2FF',
  identifier: '#E8E2FF',
  punctuation: '#E8E2FF',
};

// Lines outside the highlight dim to 38% as the highlight comes in.
export const dimmedOpacity = (highlighted: boolean, strength: number): number => (highlighted ? 1 : 1 - 0.62 * strength);
