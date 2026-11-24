import type { OutfitDesign } from './OutfitDesign.ts';

/** Science-fiction clothes. */
export const FUTURE_OUTFITS = {
  spacesuit: { era: 'future', sleeve: 'long', palette: { main: '#e9eef2', accent: '#e8735a', secondary: '#e9eef2', legs: '#dfe5ea', shoes: '#8a96a3' } },
  cyber: { era: 'future', sleeve: 'long', palette: { main: '#252a3a', accent: '#3ff0d8', secondary: '#252a3a', legs: '#1d2130', shoes: '#3a3f52' } },
  'robot-armor': { era: 'future', sleeve: 'long', palette: { main: '#8f9cab', accent: '#5fe0ff', secondary: '#7a8796', legs: '#6f7b89', shoes: '#4f5966' } },
  utopian: { era: 'future', sleeve: 'short', palette: { main: '#f3efe2', accent: '#7fc4b8', secondary: '#f3efe2', legs: '#c9d8e8', shoes: '#f1efe9' } },
} as const satisfies Readonly<Record<string, OutfitDesign>>;
