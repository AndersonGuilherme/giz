import { BARE_LEGS, type OutfitDesign } from './OutfitDesign.ts';

/** Period clothes, from the stone age to the 1950s (generic archetypes, no specific character). */
export const PAST_OUTFITS = {
  caveman: { era: 'past', sleeve: 'bare', palette: { main: '#a8763e', accent: '#5e3d1f', secondary: '#a8763e', legs: BARE_LEGS, shoes: '#6b4a2e' } },
  'ancient-egypt': { era: 'past', sleeve: 'bare', palette: { main: '#f1e9d2', accent: '#d9a730', secondary: '#f1e9d2', legs: BARE_LEGS, shoes: '#c08a3e' } },
  toga: { era: 'past', sleeve: 'bare', palette: { main: '#f3efe2', accent: '#8e3b5a', secondary: '#f3efe2', legs: BARE_LEGS, shoes: '#8a5a32' } },
  viking: { era: 'past', sleeve: 'long', palette: { main: '#5f7a5a', accent: '#b08452', secondary: '#5f7a5a', legs: '#5a4a3a', shoes: '#4a3424' } },
  knight: { era: 'past', sleeve: 'long', palette: { main: '#2f5c9e', accent: '#f2c14e', secondary: '#a7b1b9', legs: '#8f99a1', shoes: '#6c757d' } },
  commoner: { era: 'past', sleeve: 'long', palette: { main: '#8a6f4e', accent: '#5a4030', secondary: '#8a6f4e', legs: '#4a3f36', shoes: '#6b4a2e' } },
  renaissance: { era: 'past', sleeve: 'long', palette: { main: '#7a2e3b', accent: '#e8c872', secondary: '#c9a25a', legs: '#2f2a40', shoes: '#3a2c22' } },
  pirate: { era: 'past', sleeve: 'long', palette: { main: '#8c2f2f', accent: '#d9b34a', secondary: '#8c2f2f', legs: '#3a3245', shoes: '#2b2420' } },
  victorian: { era: 'past', sleeve: 'long', palette: { main: '#4a5a8c', accent: '#efe6d2', secondary: '#4a5a8c', legs: '#2f2a33', shoes: '#2b2420' } },
  '1920s': { era: 'past', sleeve: 'bare', palette: { main: '#c9a64b', accent: '#2b2833', secondary: '#c9a64b', legs: BARE_LEGS, shoes: '#2b2833' } },
  '1950s': { era: 'past', sleeve: 'short', palette: { main: '#e06a7a', accent: '#f3efe2', secondary: '#f3efe2', legs: BARE_LEGS, shoes: '#2b2833' } },
} as const satisfies Readonly<Record<string, OutfitDesign>>;
