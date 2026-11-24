import { BARE_LEGS, type OutfitDesign } from './OutfitDesign.ts';

/** Everyday and work clothes of today. `casual` was `tshirt` before the era wardrobe. */
export const PRESENT_OUTFITS = {
  casual: { era: 'present', sleeve: 'short', palette: { main: '#2f8f83', accent: '#f2b134', sleeve: '#2f8f83', legs: '#34405a', shoes: '#f1efe9' } },
  hoodie: { era: 'present', sleeve: 'long', palette: { main: '#d9644a', accent: '#f6e7c8', sleeve: '#d9644a', legs: '#3d5a8a', shoes: '#f1efe9' } },
  dress: { era: 'present', sleeve: 'long', palette: { main: '#6c4f9c', accent: '#f2b134', sleeve: '#6c4f9c', legs: '#3a3038', shoes: '#7a3b4a' } },
  suit: { era: 'present', sleeve: 'long', palette: { main: '#2f3a4f', accent: '#c8423b', sleeve: '#2f3a4f', legs: '#2f3a4f', shoes: '#1f1a18' } },
  'school-uniform': { era: 'present', sleeve: 'short', palette: { main: '#2f4a7a', accent: '#c8423b', sleeve: '#f3efe2', legs: '#55606e', shoes: '#2b2420' } },
  'lab-coat': { era: 'present', sleeve: 'long', palette: { main: '#f4f2ec', accent: '#5a86c4', sleeve: '#f4f2ec', legs: '#3b4458', shoes: '#2b2420' } },
  scrubs: { era: 'present', sleeve: 'short', palette: { main: '#4fa3a0', accent: '#f3efe2', sleeve: '#4fa3a0', legs: '#4fa3a0', shoes: '#f1efe9' } },
  chef: { era: 'present', sleeve: 'long', palette: { main: '#f7f4ec', accent: '#c8423b', sleeve: '#f7f4ec', legs: '#2f2f36', shoes: '#1f1a18' } },
  athlete: { era: 'present', sleeve: 'bare', palette: { main: '#e0533d', accent: '#f3efe2', sleeve: '#e0533d', legs: BARE_LEGS, shoes: '#f1efe9' } },
  'hi-vis': { era: 'present', sleeve: 'long', palette: { main: '#ff8a1f', accent: '#e8eef0', sleeve: '#5a6470', legs: '#3b4458', shoes: '#5a4632' } },
} as const satisfies Readonly<Record<string, OutfitDesign>>;
