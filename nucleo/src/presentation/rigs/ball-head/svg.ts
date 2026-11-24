import { useId } from 'react';

/** Unique id per instance for gradients and clips (React's `useId` contains ":", which breaks `url(#…)`). */
export function useSvgId(prefix: string): string {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

const channels = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

/** Mixes the color with black (amount < 0) or white (amount > 0); `amount` from -1 to 1. */
export function shade(hex: string, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const mixed = channels(hex).map((channel) => Math.round(channel + (target - channel) * Math.abs(amount)));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** White on a dark head, near-black on a light one (brows, mouth outline). */
export function contrast(hex: string): string {
  const [red, green, blue] = channels(hex);
  return 0.299 * red + 0.587 * green + 0.114 * blue < 140 ? '#f5f5f2' : '#1b1b1b';
}
