// Personagens em SPRITES (pacote personagens/2d/assets): corpo inteiro + retratos de expressão.
// Não há boca articulada nos sprites: a fala aparece como movimento do corpo guiado pelo volume do áudio,
// e a expressão aparece num balão com o retrato correspondente, que surge quando a expressão muda.
import React from 'react';
import { Img, interpolate, spring, staticFile } from 'remotion';
import type { Expression, Pose, Speaker } from './types';

// expressões do roteiro → retratos disponíveis no pacote (neutral não mostra balão)
// Só expressões que MUDAM o sentido da fala ganham balão. Simpatia (happy/excited) é o estado normal: sem balão,
// senão o balão pipoca a cada fala e os personagens parecem eufóricos sem motivo.
const PORTRAIT: Record<Expression, string | null> = {
  neutral: null, happy: null, excited: null, surprised: 'surprised', confused: 'confused',
  thinking: 'thinking', skeptical: 'focused', concerned: 'confused',
};
const ASPECT: Record<Speaker, number> = { lia: 379 / 868, teo: 379 / 844 };
// os dois desenhos gesticulam para fora da tela no original: espelhados, apontam para o centro
const FLIP: Record<Speaker, number> = { lia: -1, teo: -1 };
// os PNGs de corpo inteiro trazem um risco vertical (sobra do recorte da ficha) na borda direita, da cintura para baixo
const CLIP = 'polygon(0 0, 100% 0, 100% 58%, 93% 58%, 93% 100%, 0 100%)';

export type SpriteState = {
  expr: Expression;
  pose: Pose;
  exprSince: number; // quadros desde que a expressão atual começou
  poseSince: number; // quadros desde que a pose atual começou
  listener: boolean; // quem escuta não ganha balão: reage só com o corpo
  speaking: boolean;
  open: number; // volume da fala 0..1 neste quadro
  side: -1 | 1; // -1 esquerda, 1 direita (o sprite é espelhado para olhar para o centro)
};

// compact: layout de coluna lateral (pouco espaço): o balão fica acima da cabeça, não ao lado
export const SpriteCharacter: React.FC<{ who: Speaker; height: number; frame: number; fps: number; s: SpriteState; compact?: boolean }> = ({ who, height, frame, fps, s, compact = false }) => {
  const width = height * ASPECT[who];
  const seed = who === 'lia' ? 0 : 1.7;
  const t = frame / fps;
  // Movimento contido: gente de verdade não pula a cada sílaba. Respiração lenta; ao falar, o corpo
  // acompanha o volume de leve (sem quique), e os gestos fortes acontecem UMA vez, quando a pose começa.
  const since = s.poseSince / fps; // s desde que a pose começou
  const once = (dur: number) => (since < dur ? Math.sin((since / dur) * Math.PI) : 0); // 0→1→0 uma vez
  let y = Math.sin(t * 1.5 + seed) * 2;
  let rot = 0;
  let scale = 1;
  if (s.speaking) {
    y -= s.open * 5;
    scale += s.open * 0.006;
    rot = Math.sin(t * 1.3 + seed) * 0.6 * s.open;
  }
  if (s.pose === 'celebrate') y -= once(0.5) * 18;
  if (s.pose === 'think') rot += 2 + Math.sin(t * 0.9) * 0.6;
  if (s.pose === 'raise') rot += once(0.6) * 2;
  if (s.pose === 'wave') rot += since < 1.6 ? Math.sin(since * 7) * 2 * (1 - since / 1.6) : 0;

  const portrait = s.listener ? null : PORTRAIT[s.expr];
  const pop = spring({ frame: s.exprSince, fps, config: { damping: 11, mass: 0.6 } });
  const fade = interpolate(s.exprSince, [fps * 2.6, fps * 3.1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bubble = portrait ? pop * fade : 0;
  const b = height * 0.27; // diâmetro do balão

  return (
    <div style={{ position: 'relative', width, height }}>
      <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: -6, height: 22, borderRadius: '50%', background: 'rgba(85,24,130,.13)', transform: `scaleX(${1 - Math.min(0.3, -y / 120)})` }} />
      <Img src={staticFile(`sprites/${who}-full.png`)} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center',
        transformOrigin: '50% 90%', transform: `translateY(${y}px) rotate(${rot * -s.side}deg) scale(${scale}) scaleX(${FLIP[who]})`, clipPath: CLIP,
        filter: 'drop-shadow(0 14px 14px rgba(85,24,130,.12))',
      }} />
      {portrait && bubble > 0.01 && (
        <div style={{ position: 'absolute', width: b, height: b, top: compact ? -b * 1.02 : -b * 0.85, left: compact ? (width - b) / 2 : s.side === -1 ? width * 0.12 - b : width * 0.62,
          transform: `scale(${bubble})`, transformOrigin: compact ? '50% 100%' : s.side === -1 ? '100% 100%' : '0% 100%', opacity: bubble }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', border: '6px solid #c9b2ff', boxShadow: '0 10px 24px rgba(85,24,130,.18)', overflow: 'hidden', display: 'grid', placeItems: 'end center' }}>
            <Img src={staticFile(`sprites/${who}-${portrait}.png`)} style={{ width: '92%', height: '92%', objectFit: 'contain', objectPosition: 'bottom center' }} />
          </div>
        </div>
      )}
    </div>
  );
};
