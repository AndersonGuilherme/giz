import type { InterfaceLanguage, Translate } from '../shared/i18n/translate.ts';

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

/** "US$ 0,13" / "$0.13": two decimals, or four below a cent (an estimate that small still says something). */
export function formatDollars(dollars: number, language: InterfaceLanguage): string {
  const digits = dollars > 0 && dollars < 0.01 ? 4 : 2;
  return new Intl.NumberFormat(language, { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(dollars);
}

/** A duration preset: "30 s", "1 min", "1 min 30 s" (the units come from the interface language). */
export function durationText(total: number, translate: Translate): string {
  const [minutes, seconds] = [Math.floor(total / 60), total % 60];
  if (minutes === 0) return translate('idea.presetSeconds', { seconds });
  return seconds ? translate('idea.presetMinutesSeconds', { minutes, seconds }) : translate('idea.presetMinutes', { minutes });
}
