import { shade } from '../svg.ts';

/** The motor's fixed colors (`motor/src/Character.tsx`); the character's own colors are parameters. */
export const PALETTE = {
  ink: '#161616', sparkle: '#F2F2F2', drawstring: '#EDE4FF', jeans: '#3D5A99', jeansCuff: '#5672B0',
  sole: '#F4F0FF', tongue: '#F06A7A', teeth: '#FFFFFF', blush: '#F79AA8', shadow: '#2a0a5e', star: '#FFD54A', code: '#C9B8FF',
} as const;

const channels = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
const WARM_SHADE = [0.985, 0.9, 0.78]; // the motor's skin shade (#FDD6B0 → #F9C089): darker, toward orange

/** The skin's shaded side, warmer than a plain darkening. */
export function warmShade(skin: string): string {
  const shaded = channels(skin).map((channel, index) => Math.round(channel * (WARM_SHADE[index] ?? 1)));
  return `#${shaded.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** The brows are a deep tone of the hair (#6D1AE6 → about the motor's #3A0F78). */
export function browColor(hairColor2: string): string {
  return shade(hairColor2, -0.45);
}
