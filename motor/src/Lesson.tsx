import React from 'react';
import { AbsoluteFill, Html5Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import type { LessonProps, ResolvedCue, ResolvedScene, Speaker, CharacterState, Look } from './types';
import { Character, POSES, EXPRESSIONS, frontFor, type Rig } from './Character';
import { SpriteCharacter, type SpriteState } from './SpriteCharacter';
import { CAST, SIDE } from './cast';
import { THEME, fonts } from './theme';
import * as S from './scenes';

const CONTENT = { left: 600, top: 60, width: 1260, height: 820 };
const SFX_VOLUME: Record<string, number> = { pop: 0.35, whoosh: 0.18, ding: 0.3, dings: 0.28, error: 0.32, success: 0.3, tick: 0.25 };

const SCENES: { [K in ResolvedScene['kind']]: React.FC<S.SceneProps<K>> } = {
  title: S.TitleScene, talk: S.TalkScene, inbox: S.InboxScene, card: S.CardScene, quote: S.QuoteScene,
  chart: S.ChartScene, house: S.HouseScene, symptoms: S.SymptomsScene, code: S.CodeScene,
  terminal: S.TerminalScene, graph: S.GraphScene, versus: S.VersusScene, table: S.TableScene,
};

const cueAt = (cues: ResolvedCue[], frame: number) => {
  const i = cues.findIndex((c) => frame < c.startFrame + c.durationInFrames);
  return i < 0 ? cues.length - 1 : i;
};

function sceneState(cues: ResolvedCue[], i: number, frame: number) {
  const cue = cues[i];
  const local = frame - cue.startFrame;
  let state = cue.scene as Record<string, unknown>;
  let lastChange = -Infinity;
  let first = i;
  while (first > 0 && cues[first - 1].sceneKey === cue.sceneKey) first--;
  for (let j = first; j <= i; j++) {
    const c = cues[j];
    if (j === first || c.resetsAtStart) lastChange = Math.max(lastChange, j === 0 ? 0 : c.startFrame);
    c.beatFrames.forEach((bf, k) => {
      const sceneKeys = Object.keys(c.beats[k]).filter((key) => !['expr', 'pose', 'sfx'].includes(key));
      if (sceneKeys.length && c.startFrame + bf <= frame) lastChange = Math.max(lastChange, c.startFrame + bf);
    });
  }
  cue.beats.forEach((b, k) => {
    if (cue.beatFrames[k] > local) return;
    const { expr: _e, pose: _p, sfx: _s, ...rest } = b;
    state = { ...state, ...rest };
  });
  return { state: state as ResolvedScene, age: frame - lastChange, sceneAge: frame - (first === 0 ? 0 : cues[first].startFrame) };
}

// Estado de um personagem no frame (com beats de expressão/pose aplicados) e quando ele começou.
function charState(cue: ResolvedCue, who: Speaker, local: number): { st: CharacterState; since: number } {
  let st = cue.chars[who];
  let since = 0;
  if (who === cue.speaker) {
    cue.beats.forEach((b, k) => {
      if (cue.beatFrames[k] <= local && (b.expr || b.pose)) {
        st = { ...st, ...(b.expr ? { expr: b.expr } : {}), ...(b.pose ? { pose: b.pose } : {}) };
        since = cue.beatFrames[k];
      }
    });
  }
  return { st, since };
}

const finalState = (cue: ResolvedCue, who: Speaker) => charState(cue, who, Number.MAX_SAFE_INTEGER).st;

// quadro absoluto em que a expressão atual do personagem começou (atravessa falas com a mesma expressão)
function exprStart(cues: ResolvedCue[], i: number, who: Speaker, local: number, key: 'expr' | 'pose' = 'expr'): number {
  const { st, since } = charState(cues[i], who, local);
  let start = cues[i].startFrame + since;
  if (since > 0) return start;
  for (let j = i - 1; j >= 0 && finalState(cues[j], who)[key] === st[key]; j--) start = cues[j].startFrame;
  return start;
}

function eyeTarget(who: Speaker, look: Look, stage: boolean): number {
  if (look === 'viewer' || (look === 'content' && stage)) return 0;
  if (look === 'content') return 7; // o conteúdo fica à direita
  return SIDE[who] === -1 ? 7 : -7; // olhar para o colega
}

// characters: 'rig' (boneco vetorial articulado, padrão) ou 'sprite' (pacote de sprites em personagens/2d/assets)
export const LessonVideo: React.FC<{ lesson: string; data?: LessonProps; captions?: boolean; characters?: 'rig' | 'sprite' }> = ({ data, captions = true, characters = 'rig' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!data) return null;
  const { cues } = data;
  const i = cueAt(cues, frame);
  const cue = cues[i];
  const local = frame - cue.startFrame;
  const { state, age, sceneAge } = sceneState(cues, i, frame);
  const Scene = SCENES[state.kind] as React.FC<S.SceneProps<typeof state.kind>>;
  const stage = state.kind === 'talk';
  const talking = local >= 0 && local < cue.speechFrames; // local < 0: abertura silenciosa antes da 1ª fala
  const holding = !talking && local >= 0 && local < cue.speechFrames + cue.holdFrames;

  const rigFor = (who: Speaker): Rig => {
    const { st, since } = charState(cue, who, local);
    const prev = since > 0 ? charState(cue, who, since - 1).st : i > 0 ? finalState(cues[i - 1], who) : st;
    const t = spring({ frame: local - since, fps, config: { damping: 22, mass: 1.1 } }); // sem quique: gesto de gente, não de mola
    const mix = (a: number[], b: number[]) => a.map((v, k) => v + (b[k] - v) * t);
    const ea = EXPRESSIONS[prev.expr], eb = EXPRESSIONS[st.expr];
    const prevStage = since === 0 && i > 0 ? cues[i - 1].scene.kind === 'talk' : stage;
    const e0 = eyeTarget(who, prev.look, prevStage), e1 = eyeTarget(who, st.look, stage);
    const ex = e0 + (e1 - e0) * t;
    const ey = ea.eyeDy + (eb.eyeDy - ea.eyeDy) * t;
    const seed = who === 'lia' ? 0 : 47;
    const ph = (frame + seed) % 137, ph2 = (frame + seed * 3) % 311;
    const blink = ph < 5 ? [0.5, 1, 1, 0.6, 0.2][ph] : ph2 < 4 ? [0.6, 1, 0.8, 0.3][ph2] : 0;
    const speaking = who === cue.speaker && talking;
    let mouth: Rig['mouth'] = { talking: false, shape: eb.mouth };
    let bob = 0;
    if (speaking) {
      const open = cue.envelope ? (cue.envelope[local] ?? 0) : Math.max(0, 0.5 + 0.5 * Math.sin(local * 1.7) * Math.sin(local * 0.53 + 1));
      const viseme = cue.visemes ? (cue.visemes[local] ?? 'X') : open > 0.15 ? 'A' : 'X';
      mouth = { talking: true, viseme, open, shape: eb.mouth };
      bob = Math.sin(local * 0.32) * 1.8 * open;
    } else if (who !== cue.speaker) {
      bob = Math.sin((frame / fps) * 2.1 + seed) * 0.9; // quem escuta acompanha com a cabeça
    }
    return {
      arms: mix(POSES[prev.pose], POSES[st.pose]),
      brows: mix(ea.brows, eb.brows),
      lids: mix(ea.lids, eb.lids),
      eye: [ex, ey],
      faceDx: ex * 0.9,
      mouth, blink, bob,
      front: t > 0.5 ? frontFor(st.pose) : frontFor(prev.pose),
      waveFrame: st.pose === 'wave' ? local : undefined,
    };
  };

  const order: Speaker[] = ['lia', 'teo'];
  const charW = stage ? 440 : 270;
  const sprite = characters === 'sprite';
  const spriteH = stage ? 620 : 470;
  const spriteFor = (who: Speaker): SpriteState => {
    const { st } = charState(cue, who, local);
    const speaking = who === cue.speaker && talking;
    return { expr: st.expr, pose: st.pose, exprSince: frame - exprStart(cues, i, who, local), poseSince: frame - exprStart(cues, i, who, local, 'pose'), speaking, listener: who !== cue.speaker, open: speaking ? (cue.envelope?.[local] ?? 0.5) : 0, side: SIDE[who] };
  };
  const caption = cue.captions.reduce((acc, c) => (c.frame <= local ? c : acc), cue.captions[0]);
  const holdLeft = Math.ceil((cue.speechFrames + cue.holdFrames - local) / fps);

  return (
    <AbsoluteFill style={{ background: THEME.bg, fontFamily: fonts.sans }}>
      {cues.filter((c) => c.audio).map((c) => (
        <Sequence key={c.id} from={c.startFrame} durationInFrames={c.durationInFrames} layout="none">
          <Html5Audio src={staticFile(c.audio!)} />
        </Sequence>
      ))}
      {data.sfx.map((e, k) => (
        <Sequence key={`sfx-${k}`} from={e.frame} durationInFrames={3 * fps} layout="none">
          <Html5Audio src={staticFile(`sfx/${e.sfx}.wav`)} volume={SFX_VOLUME[e.sfx]} />
        </Sequence>
      ))}

      <div style={{ position: 'absolute', left: 60, top: 52 }}>
        <div style={{ font: `900 58px ${fonts.sans}`, background: THEME.gradient, WebkitBackgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>{data.brand ?? 'giz'}</div>
        <div style={{ font: `700 26px/1.25 ${fonts.sans}`, color: THEME.muted, marginTop: 12, maxWidth: 470 }}>{data.title}</div>
        {!stage && <div style={{ font: `900 32px ${fonts.sans}`, color: THEME.brand, marginTop: 10 }}>{data.chapters[cue.chapter - 1]}</div>}
      </div>

      {!stage && (
        <div key={cue.sceneKey} style={{ position: 'absolute', ...CONTENT }}>
          <Scene state={state as never} age={age} sceneAge={sceneAge} fps={fps} width={CONTENT.width} height={CONTENT.height} />
        </div>
      )}

      {holding && cue.hold && (
        <div style={{ position: 'absolute', left: 60, top: 300, width: 400, padding: '22px 26px', borderRadius: 28, background: THEME.ink, color: '#fff', display: 'flex', alignItems: 'center', gap: 20, boxShadow: THEME.shadow,
          transform: `scale(${spring({ frame: local - cue.speechFrames, fps, config: { damping: 12 } })})` }}>
          <div style={{ width: 84, height: 84, flex: 'none', borderRadius: 42, background: THEME.gradient, display: 'grid', placeItems: 'center', font: `900 48px ${fonts.sans}` }}>{holdLeft}</div>
          <div style={{ font: `800 30px/1.2 ${fonts.sans}` }}>{cue.hold.label}</div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: stage ? (sprite ? 240 : 170) : 150, left: stage ? 0 : 20, width: stage ? 1920 : 560, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: stage ? (sprite ? 320 : 140) : sprite ? 40 : 0 }}>
        {order.map((who) => (
          <div key={who} style={{ position: 'relative' }}>
            {sprite
              ? <SpriteCharacter who={who} height={spriteH} frame={frame} fps={fps} s={spriteFor(who)} compact={!stage} />
              : <Character who={who} uid={`c-${who}`} width={charW} frame={frame} fps={fps} rig={rigFor(who)} />}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: sprite ? -44 : -8, textAlign: 'center', font: `900 ${stage ? 30 : 22}px ${fonts.sans}`, color: who === cue.speaker && talking ? THEME.brand : '#b3a8cc' }}>
              {CAST[who].name}
            </div>
          </div>
        ))}
      </div>

      {captions && caption && (
        <div style={{ position: 'absolute', left: stage ? 260 : CONTENT.left, width: stage ? 1400 : CONTENT.width, top: 900, minHeight: 104, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(29,21,48,.86)', color: '#fff', padding: '14px 30px', borderRadius: 18, font: `700 31px/1.32 ${fonts.sans}`, textAlign: 'center', opacity: talking ? interpolate(local, [0, 4], [0, 1], { extrapolateRight: 'clamp' }) : 0 }}>
            <span style={{ color: cue.speaker === 'lia' ? '#F5A3F1' : '#B9A3FF' }}>{CAST[cue.speaker].name}: </span>
            {caption.text}
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 26, display: 'flex', gap: 10 }}>
        {data.chapters.map((name, k) => {
          const n = k + 1;
          return (
            <div key={name} style={{ flex: 1 }}>
              <div style={{ height: 8, borderRadius: 4, background: n < cue.chapter ? THEME.brand : n === cue.chapter ? THEME.gradient : THEME.line }} />
              <div style={{ font: `800 18px ${fonts.sans}`, color: n === cue.chapter ? THEME.brand : '#b3a8cc', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{name}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
