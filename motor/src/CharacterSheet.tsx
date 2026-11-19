// Ficha dos personagens: todas as expressões e poses lado a lado, para revisão do guia editorial.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Character, POSES, EXPRESSIONS, frontFor, type Rig } from './Character';
import { CAST } from './cast';
import { THEME, fonts } from './theme';
import type { Expression, Pose, Speaker } from './types';

const rig = (expr: Expression, pose: Pose, look = 0): Rig => ({
  arms: POSES[pose], brows: EXPRESSIONS[expr].brows, lids: EXPRESSIONS[expr].lids,
  eye: [look, EXPRESSIONS[expr].eyeDy], faceDx: look * 0.9, mouth: { talking: false, shape: EXPRESSIONS[expr].mouth },
  front: frontFor(pose), blink: 0, bob: 0,
});

export const CharacterSheet: React.FC = () => {
  const exprs = Object.keys(EXPRESSIONS) as Expression[];
  const poses = Object.keys(POSES) as Pose[];
  const row = (who: Speaker, items: string[], kind: 'expr' | 'pose') => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
      <div style={{ width: 120, font: `900 34px ${fonts.sans}`, color: THEME.brand }}>{CAST[who].name}</div>
      {items.map((k) => (
        <div key={k} style={{ width: 216, textAlign: 'center' }}>
          {kind === 'expr'
            ? <div style={{ height: 170, overflow: 'hidden' }}><Character who={who} uid={`${who}-${k}`} width={210} frame={0} fps={30} rig={rig(k as Expression, 'neutral')} /></div>
            : <Character who={who} uid={`${who}-p-${k}`} width={150} frame={0} fps={30} rig={rig('happy', k as Pose)} />}
          <div style={{ font: `800 22px ${fonts.sans}`, color: THEME.muted }}>{k}</div>
        </div>
      ))}
    </div>
  );
  return (
    <AbsoluteFill style={{ background: THEME.bg, padding: 40, gap: 18 }}>
      <div style={{ font: `900 44px ${fonts.sans}`, color: THEME.ink }}>Lia e Téo — expressões e poses</div>
      {row('lia', exprs, 'expr')}
      {row('teo', exprs, 'expr')}
      {row('lia', poses, 'pose')}
      {row('teo', poses, 'pose')}
    </AbsoluteFill>
  );
};
