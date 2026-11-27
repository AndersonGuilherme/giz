import type { InterfaceLanguage } from '../shared/i18n/translate.ts';

const GIGABYTE = 1e9;
const MEGABYTE = 1e6;

/** "5,9 GB" / "5.9 GB"; below a gigabyte in MB ("240 MB"). */
export function formatBytes(bytes: number, language: InterfaceLanguage): string {
  const big = bytes >= GIGABYTE;
  const value = big ? bytes / GIGABYTE : bytes / MEGABYTE;
  const digits = big && value < 100 ? 1 : 0;
  const number = new Intl.NumberFormat(language, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  return `${number} ${big ? 'GB' : 'MB'}`;
}
