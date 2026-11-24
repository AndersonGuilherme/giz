// Catálogo de cenas (docs/guides/scene-catalog.md). Cada cena recebe o ESTADO atual (cena + beats já
// aplicados), `age` (frames desde a última mudança de estado) e `sceneAge` (frames desde que a cena entrou).
import React from 'react';
import { interpolate, spring, Easing } from 'remotion';
import type { ResolvedScene } from './types';
import { THEME, fonts } from './theme';

export type SceneProps<K extends ResolvedScene['kind']> = {
  state: Extract<ResolvedScene, { kind: K }>;
  age: number;
  sceneAge: number;
  fps: number;
  width: number;
  height: number;
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const pop = (age: number, fps: number, delay = 0) => spring({ frame: age - delay, fps, config: { damping: 14, mass: 0.6 } });
const fadeUp = (t: number): React.CSSProperties => ({ opacity: t, transform: `translateY(${(1 - t) * 24}px)` });

const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ width: '100%', height: '100%', background: THEME.card, borderRadius: 36, boxShadow: THEME.shadow, padding: 56, boxSizing: 'border-box', ...style }}>
    {children}
  </div>
);

// ───────────────────────── title
export const TitleScene: React.FC<SceneProps<'title'>> = ({ state, sceneAge, fps }) => {
  const t = pop(sceneAge, fps);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, ...fadeUp(t) }}>
      <div style={{ font: `700 34px ${fonts.sans}`, color: THEME.brand, letterSpacing: 2, textTransform: 'uppercase' }}>{state.eyebrow}</div>
      <div style={{ font: `900 124px/1.02 ${fonts.sans}`, background: THEME.gradient, WebkitBackgroundClip: 'text', color: 'transparent' }}>{state.title}</div>
      {state.subtitle && <div style={{ font: `600 44px ${fonts.sans}`, color: THEME.muted }}>{state.subtitle}</div>}
    </div>
  );
};

// ───────────────────────── talk (os personagens são desenhados pelo layout; aqui só o fundo)
export const TalkScene: React.FC<SceneProps<'talk'>> = () => null;

// ───────────────────────── inbox
export const InboxScene: React.FC<SceneProps<'inbox'>> = ({ state, age, sceneAge, fps }) => {
  const enter = pop(sceneAge, fps);
  const n = state.count === 0 ? 0 : Math.round(interpolate(age, [0, 2.2 * fps], [0, state.count], { ...clamp, easing: Easing.in(Easing.quad) }));
  const rows = Math.min(5, Math.ceil(n / 600));
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...fadeUp(enter) }}>
      <div style={{ width: 760, background: THEME.card, borderRadius: 48, boxShadow: THEME.shadow, padding: 44, position: 'relative' }}>
        {state.note && <div style={{ position: 'absolute', top: -26, left: 44, padding: '8px 20px', borderRadius: 999, background: '#FFF4D6', color: '#8A5A00', font: `800 22px ${fonts.sans}`, letterSpacing: 0.5, boxShadow: THEME.shadow }}>{state.note}</div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ font: `800 46px ${fonts.sans}`, color: THEME.ink }}>Caixa de entrada</div>
          <div style={{ minWidth: 120, padding: '10px 26px', borderRadius: 999, background: n ? THEME.danger : THEME.line, color: '#fff', font: `900 44px ${fonts.sans}`, textAlign: 'center', transform: `scale(${1 + (n > 0 && n < state.count ? 0.08 * Math.sin(age) : 0)})` }}>
            {n.toLocaleString('pt-BR')}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '18px 0', borderTop: `2px solid ${THEME.line}`, opacity: i < rows ? 1 : 0.18 }}>
            <div style={{ width: 54, height: 54, borderRadius: 27, background: i < rows ? THEME.gradient : THEME.line }} />
            <div style={{ flex: 1 }}>
              <div style={{ font: `800 32px ${fonts.sans}`, color: THEME.ink }}>{i < rows ? state.subject : ' '}</div>
              <div style={{ font: `500 26px ${fonts.sans}`, color: THEME.muted }}>{i < rows ? 'loja@exemplo.com · agora' : ' '}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ───────────────────────── card (objetivo, resumo, desafio, próxima)
const VARIANT: Record<string, { label: string; color: string; bullet: (i: number) => string }> = {
  objective: { label: 'Objetivo', color: THEME.brand, bullet: () => '◎' },
  summary: { label: 'Resumo', color: THEME.ok, bullet: (i) => String(i + 1) },
  challenge: { label: 'Desafio', color: THEME.magenta, bullet: (i) => String(i + 1) },
  next: { label: 'Próxima aula', color: THEME.brand, bullet: () => '→' },
  ticket: { label: 'Pedido do negócio', color: '#0EA5A4', bullet: () => '+' },
  rule: { label: 'Regra da loja', color: '#B45309', bullet: () => '§' },
};
export const CardScene: React.FC<SceneProps<'card'>> = ({ state, age, sceneAge, fps }) => {
  const v = VARIANT[state.variant];
  const shown = state.shown ?? state.items.length;
  return (
    <Panel style={fadeUp(pop(sceneAge, fps))}>
      <div style={{ display: 'inline-block', padding: '10px 26px', borderRadius: 999, background: v.color, color: '#fff', font: `800 28px ${fonts.sans}`, letterSpacing: 1, textTransform: 'uppercase' }}>{v.label}</div>
      <div style={{ font: `900 64px/1.1 ${fonts.sans}`, color: THEME.ink, margin: '28px 0 40px' }}>{state.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {state.items.map((item, i) => {
          const visible = i < shown;
          const t = !visible ? 0 : i === shown - 1 ? pop(age, fps) : 1;
          return (
            <div key={i} style={{ display: 'flex', gap: 28, alignItems: 'center', ...fadeUp(t) }}>
              <div style={{ width: 72, height: 72, flex: 'none', borderRadius: 22, background: v.color, color: '#fff', display: 'grid', placeItems: 'center', font: `900 36px ${fonts.sans}` }}>{v.bullet(i)}</div>
              <div style={{ font: `700 46px/1.2 ${fonts.sans}`, color: THEME.ink }}>{item}</div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

// ───────────────────────── quote (frase-chave)
export const QuoteScene: React.FC<SceneProps<'quote'>> = ({ state, sceneAge, fps }) => {
  const lines = state.text.split('\n');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
      <div style={{ font: `900 220px/0.6 ${fonts.sans}`, background: THEME.gradient, WebkitBackgroundClip: 'text', color: 'transparent', opacity: pop(sceneAge, fps) }}>“</div>
      {lines.map((l, i) => (
        <div key={i} style={{ font: `900 76px/1.15 ${fonts.sans}`, color: i === lines.length - 1 ? THEME.brand : THEME.ink, ...fadeUp(pop(sceneAge, fps, 12 + i * 22)) }}>{l}</div>
      ))}
    </div>
  );
};

// ───────────────────────── chart (custo da mudança)
export const ChartScene: React.FC<SceneProps<'chart'>> = ({ state, age, sceneAge, fps, width, height }) => {
  const W = width - 112, H = height - 180, x0 = 90, y0 = H;
  const curve = (f: (t: number) => number) =>
    Array.from({ length: 61 }, (_, i) => { const t = i / 60; return `${i ? 'L' : 'M'}${x0 + t * (W - x0)},${y0 - f(t) * (H - 40)}`; }).join(' ');
  const paths = {
    healthy: { d: curve((t) => 0.12 + 0.22 * t), color: THEME.ok, label: 'saudável' },
    rotten: { d: curve((t) => 0.12 + 0.88 * Math.pow(t, 3.2)), color: THEME.danger, label: 'apodrecido' },
  };
  return (
    <Panel style={fadeUp(pop(sceneAge, fps))}>
      <svg width={W} height={H + 70} style={{ overflow: 'visible' }}>
        <path d={`M${x0},20 V${y0} H${W}`} fill="none" stroke={THEME.ink} strokeWidth="5" strokeLinecap="round" />
        <text x={W} y={y0 + 56} textAnchor="end" style={{ font: `700 32px ${fonts.sans}`, fill: THEME.muted }}>{state.xLabel} →</text>
        <text transform={`translate(${x0 - 34} ${y0}) rotate(-90)`} style={{ font: `700 32px ${fonts.sans}`, fill: THEME.muted }}>{state.yLabel} →</text>
        {state.curves.map((k, i) => {
          const p = paths[k];
          const isNew = i === state.curves.length - 1;
          const progress = isNew ? interpolate(age, [0, 1.6 * fps], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 1;
          const endY = k === 'healthy' ? y0 - 0.34 * (H - 40) : 60;
          return (
            <g key={k}>
              <path d={p.d} fill="none" stroke={p.color} strokeWidth="12" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} />
              <text x={W - 10} y={endY - 22} textAnchor="end" style={{ font: `900 40px ${fonts.sans}`, fill: p.color, opacity: progress > 0.9 ? 1 : 0 }}>{p.label}</text>
            </g>
          );
        })}
      </svg>
    </Panel>
  );
};

// ───────────────────────── house (analogia)
export const HouseScene: React.FC<SceneProps<'house'>> = ({ state, age, sceneAge, fps }) => {
  const has = (m: string) => state.marks.includes(m as never);
  const newest = state.marks[state.marks.length - 1];
  const t = (m: string) => (!has(m) ? 0 : m === newest ? pop(age, fps) : 1);
  const flicker = has('tv') && Math.floor(age / 4) % 2 === 0;
  return (
    <Panel style={{ ...fadeUp(pop(sceneAge, fps)), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 1000 680" width="100%" height="100%">
        <path d="M100,300 L500,60 L900,300" fill="none" stroke={THEME.brand} strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="150" y="290" width="700" height="360" rx="18" fill="#F4EEFF" stroke={THEME.brand} strokeWidth="10" />
        <line x1="500" y1="290" x2="500" y2="650" stroke={THEME.brand} strokeWidth="8" />
        {/* lâmpada */}
        <line x1="320" y1="290" x2="320" y2="350" stroke={THEME.ink} strokeWidth="5" />
        <circle cx="320" cy="372" r="24" fill={has('wall') ? '#d9d2e6' : '#FFD54A'} stroke={THEME.ink} strokeWidth="5" />
        {/* parede quebrada */}
        <g opacity={t('wall')} transform={`translate(0 ${(1 - t('wall')) * 20})`}>
          <path d="M210,420 l40,30 -20,30 50,25 -15,40 45,20" fill="none" stroke={THEME.danger} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M270,560 l70,-20 30,40" fill="none" stroke={THEME.danger} strokeWidth="9" strokeLinecap="round" />
          <text x="220" y="70" textAnchor="middle" style={{ font: `900 38px ${fonts.sans}`, fill: THEME.danger }}><tspan x="220">trocar a lâmpada</tspan><tspan x="220" dy="46">= quebrar a parede</tspan></text>
        </g>
        {/* TV e chuveiro */}
        <rect x="560" y="470" width="180" height="120" rx="12" fill={has('tv') && flicker ? '#111' : '#7FD3FF'} stroke={THEME.ink} strokeWidth="6" />
        <line x1="620" y1="590" x2="600" y2="630" stroke={THEME.ink} strokeWidth="6" /><line x1="680" y1="590" x2="700" y2="630" stroke={THEME.ink} strokeWidth="6" />
        <path d="M790,330 h40 v40" fill="none" stroke={THEME.ink} strokeWidth="8" strokeLinecap="round" />
        <path d="M790,385 l-8,24 M808,385 l0,26 M826,385 l8,24" stroke="#4FB3FF" strokeWidth="6" strokeLinecap="round" opacity={has('tv') ? 1 : 0.4} />
        <g opacity={t('tv')}>
          <path d="M790,420 L740,460 L770,465 L730,520" fill="none" stroke={THEME.danger} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <text x="790" y="70" textAnchor="middle" style={{ font: `900 38px ${fonts.sans}`, fill: THEME.danger }}><tspan x="790">abriu o chuveiro</tspan><tspan x="790" dy="46">= TV desliga</tspan></text>
        </g>
      </svg>
    </Panel>
  );
};

// ───────────────────────── symptoms (grade 2×2)
const SYMPTOM_COLORS = ['#FF7A45', '#E5484D', '#7B2FF2', '#0EA5A4'];
export const SymptomsScene: React.FC<SceneProps<'symptoms'>> = ({ state, age, fps }) => (
  <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 32 }}>
    {state.items.map((s, i) => {
      const visible = i < state.shown;
      const t = !visible ? 0 : i === state.shown - 1 && state.focus === undefined ? pop(age, fps) : 1;
      const focused = state.focus === undefined || state.focus === i;
      const f = state.focus === undefined ? 1 : interpolate(age, [0, 8], [state.focus === i ? 0.4 : 1, focused ? 1 : 0.4], clamp);
      return (
        <div key={i} style={{ borderRadius: 32, padding: 44, background: visible ? THEME.card : 'rgba(255,255,255,.5)', boxShadow: visible ? THEME.shadow : 'none', border: `4px ${visible ? 'solid' : 'dashed'} ${visible ? SYMPTOM_COLORS[i] : '#d9cff0'}`,
          transform: `scale(${(0.9 + 0.1 * t) * (state.focus === i ? 1.03 : 1)})`, opacity: visible ? f : 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ font: `900 30px ${fonts.sans}`, color: visible ? SYMPTOM_COLORS[i] : '#c9bfe0' }}>PISTA {String(i + 1).padStart(2, '0')}</div>
          <div style={{ font: `900 64px ${fonts.sans}`, color: visible ? THEME.ink : '#c9bfe0' }}>{visible ? s.name : '?'}</div>
          <div style={{ font: `600 36px/1.3 ${fonts.sans}`, color: THEME.muted, opacity: t }}>{visible ? s.desc : ''}</div>
        </div>
      );
    })}
  </div>
);

// ───────────────────────── code
const KEYWORDS = new Set(['export', 'class', 'const', 'let', 'if', 'else', 'for', 'of', 'return', 'new', 'import', 'type', 'function', 'from', 'true', 'false']);
type Tok = { t: string; c: string };
function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  const re = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  for (const m of line.matchAll(re)) {
    const [s, com, str, num, word] = m;
    let c = THEME.code.text;
    if (com) c = THEME.code.comment;
    else if (str) c = THEME.code.string;
    else if (num) c = THEME.code.number;
    else if (word) {
      const next = line.slice(m.index! + s.length);
      if (KEYWORDS.has(word)) c = THEME.code.keyword;
      else if (/^[A-Z]/.test(word)) c = THEME.code.type;
      else if (/^\s*\(/.test(next)) c = THEME.code.fn;
    }
    out.push({ t: s, c });
  }
  return out;
}
export const CodeScene: React.FC<SceneProps<'code'>> = ({ state, age, sceneAge, fps, width, height }) => {
  const enter = pop(sceneAge, fps);
  const hl = state.highlight ?? [];
  const n = state.lines.length;
  const maxChars = Math.max(...state.lines.map((l) => l.text.length), 40);
  const bodyH = height - 150, bodyW = width - 170;
  const lineH = Math.min(52, bodyH / n);
  const fontSize = Math.min(34, lineH * 0.72, bodyW / (maxChars * 0.61));
  const hlT = hl.length ? interpolate(age, [0, 8], [0, 1], clamp) : 0;
  return (
    <div style={{ height: '100%', background: THEME.code.bg, borderRadius: 32, boxShadow: THEME.shadow, overflow: 'hidden', ...fadeUp(enter) }}>
      <div style={{ height: 76, background: THEME.code.bar, display: 'flex', alignItems: 'center', gap: 14, padding: '0 30px' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 20, height: 20, borderRadius: 10, background: c }} />)}
        <div style={{ marginLeft: 24, padding: '10px 24px', borderRadius: 12, background: THEME.code.bg, color: '#e8e2ff', font: `600 26px ${fonts.mono}` }}>{state.title}</div>
      </div>
      <div style={{ padding: '30px 30px 30px 0' }}>
        {state.lines.map((line, i) => {
          const isHl = hl.some((h) => line.text.includes(h));
          const dim = hl.length && !isHl ? 1 - 0.62 * hlT : 1;
          return (
            <div key={i} style={{ display: 'flex', height: lineH, alignItems: 'center', font: `500 ${fontSize}px ${fonts.mono}`, fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0', whiteSpace: 'pre', opacity: dim,
              background: isHl ? `rgba(232,23,223,${0.28 * hlT})` : line.added ? 'rgba(40,200,64,.16)' : 'transparent' }}>
              <div style={{ width: 54, textAlign: 'center', color: line.added ? '#28C840' : 'transparent', fontWeight: 900 }}>+</div>
              <div style={{ width: 56, textAlign: 'right', paddingRight: 24, color: THEME.code.lineNo }}>{i + 1}</div>
              <div>{tokenize(line.text).map((tk, j) => <span key={j} style={{ color: tk.c }}>{tk.t}</span>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────── terminal
export const TerminalScene: React.FC<SceneProps<'terminal'>> = ({ state, age, sceneAge, fps }) => {
  const typed = Math.round(interpolate(sceneAge, [6, 6 + state.command.length * 0.9], [0, state.command.length], clamp));
  const tone = { fail: '#FF6B6B', ok: '#28C840', muted: '#9a90b8' } as const;
  return (
    <div style={{ height: '100%', background: '#0F0B1A', borderRadius: 32, boxShadow: THEME.shadow, padding: 56, boxSizing: 'border-box', font: `500 32px/1.7 ${fonts.mono}`, fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0', color: '#e8e2ff', ...fadeUp(pop(sceneAge, fps)) }}>
      <div><span style={{ color: '#28C840' }}>$ </span>{state.command.slice(0, typed)}<span style={{ opacity: Math.floor(sceneAge / 15) % 2 ? 0 : 1 }}>▌</span></div>
      {state.lines.map((l, i) => (
        <div key={i} style={{ color: tone[l.tone ?? 'muted'], whiteSpace: 'pre', opacity: interpolate(age, [i * 7, i * 7 + 5], [0, 1], clamp), fontWeight: l.tone === 'fail' ? 800 : 500 }}>{l.text}</div>
      ))}
    </div>
  );
};

// ───────────────────────── graph (dependências)
export const GraphScene: React.FC<SceneProps<'graph'>> = ({ state, age, sceneAge, fps, width, height }) => {
  const pos = (id: string) => { const n = state.nodes.find((x) => x.id === id)!; return { x: (n.x / 100) * width, y: (n.y / 100) * height }; };
  const bad = state.focusBad ? interpolate(age, [0, 12], [0, 1], clamp) : 0;
  const pulse = 1 + (state.focusBad ? 0.25 * Math.max(0, Math.sin(age / 6)) : 0);
  const toneBg = { core: THEME.brand, infra: '#3D5A99', ui: THEME.magenta, soft: '#0EA5A4' } as const;
  return (
    <div style={{ position: 'relative', width, height, ...fadeUp(pop(sceneAge, fps)) }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          {['ok', 'bad'].map((k) => (
            <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 Z" fill={k === 'bad' ? THEME.danger : THEME.ink} />
            </marker>
          ))}
        </defs>
        {state.edges.map((e, i) => {
          const a = pos(e.from), b = pos(e.to);
          const shrink = (p: { x: number; y: number }, q: { x: number; y: number }, d: number) => { const l = Math.hypot(q.x - p.x, q.y - p.y); return { x: p.x + ((q.x - p.x) * d) / l, y: p.y + ((q.y - p.y) * d) / l }; };
          const s = shrink(a, b, 150), t = shrink(b, a, 150);
          const isBad = e.bad && bad > 0;
          return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={isBad ? THEME.danger : THEME.ink} strokeWidth={isBad ? 10 * pulse : 7} markerEnd={`url(#arrow-${isBad ? 'bad' : 'ok'})`} opacity={e.bad ? 0.55 + 0.45 * Math.max(bad, 0.6) : 0.85} />;
        })}
      </svg>
      {state.nodes.map((n) => {
        const p = pos(n.id);
        return (
          <div key={n.id} style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-50%)', minWidth: 300, padding: '26px 34px', borderRadius: 28, background: toneBg[n.tone ?? 'core'], color: '#fff', textAlign: 'center', font: `800 36px/1.25 ${fonts.sans}`, whiteSpace: 'pre', boxShadow: THEME.shadow }}>
            {n.label}
          </div>
        );
      })}
    </div>
  );
};

// ───────────────────────── versus (certo × errado)
export const VersusScene: React.FC<SceneProps<'versus'>> = ({ state, sceneAge, fps }) => {
  const col = (side: 'wrong' | 'right', delay: number) => {
    const s = state[side];
    const color = side === 'wrong' ? THEME.danger : THEME.ok;
    return (
      <div style={{ flex: 1, borderRadius: 36, background: THEME.card, boxShadow: THEME.shadow, padding: 50, border: `5px solid ${color}`, ...fadeUp(pop(sceneAge, fps, delay)) }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: color, color: '#fff', display: 'grid', placeItems: 'center', font: `900 60px ${fonts.sans}` }}>{side === 'wrong' ? '✕' : '✓'}</div>
        <div style={{ font: `900 54px/1.15 ${fonts.sans}`, color: THEME.ink, margin: '32px 0 22px' }}>{s.title}</div>
        <div style={{ font: `600 38px/1.35 ${fonts.sans}`, color: THEME.muted, whiteSpace: 'pre-line' }}>{s.text}</div>
      </div>
    );
  };
  return <div style={{ height: '100%', display: 'flex', gap: 40 }}>{col('wrong', 0)}{col('right', 20)}</div>;
};

// ───────────────────────── table (linhas × colunas; "●" vira marca colorida)
export const TableScene: React.FC<SceneProps<'table'>> = ({ state, age, sceneAge, fps, width, height }) => {
  const shown = state.shownRows ?? state.rows.length;
  // largura: o painel inteiro é dividido entre a coluna dos rótulos e as colunas de células (sem sobra vazia)
  const inner = width - 112;
  const avail = height - 112 - (state.title ? 92 : 0) - 64;
  const rowH = Math.min(84, avail / Math.max(1, state.rows.length));
  // estimativa de linhas que um texto ocupa numa largura (fonte sans 800 ≈ 0,56 em por caractere)
  const lines = (text: string, w: number, font: number) => Math.max(1, Math.ceil((text.length * font * 0.56) / Math.max(1, w - 16)));
  const longestLabel = Math.max(...state.rows.map((r) => r.label.length), 1);
  let fontCell = Math.max(20, Math.min(32, rowH * 0.42));
  let labelW = 0, colW = 0;
  // diminui a fonte até cada célula e rótulo caberem na altura da linha (nada de texto sobreposto)
  for (; fontCell > 16; fontCell -= 1) {
    labelW = Math.min(inner * 0.42, Math.max(220, longestLabel * (fontCell + 2) * 0.56 + 24));
    colW = (inner - labelW) / Math.max(1, state.columns.length);
    const fits = (t: string, w: number, f: number) => lines(t, w, f) * f * 1.2 <= rowH - 6;
    if (state.rows.every((r) => fits(r.label, labelW, fontCell + 2) && r.cells.every((c) => fits(c, colW, fontCell)))) break;
  }
  const hl = (state.highlightCol !== undefined || state.highlightRow !== undefined) ? interpolate(age, [0, 10], [0, 1], clamp) : 0;
  return (
    <Panel style={fadeUp(pop(sceneAge, fps))}>
      {state.title && <div style={{ font: `900 50px ${fonts.sans}`, color: THEME.ink, marginBottom: 28 }}>{state.title}</div>}
      <div style={{ display: 'flex', borderBottom: `3px solid ${THEME.line}`, paddingBottom: 14 }}>
        <div style={{ width: labelW }} />
        {state.columns.map((c, j) => (
          <div key={j} style={{ width: colW, textAlign: 'center', font: `800 ${fontCell - 4}px/1.15 ${fonts.sans}`, color: state.highlightCol === j ? THEME.magenta : THEME.muted }}>{c}</div>
        ))}
      </div>
      {state.rows.map((r, i) => {
        const visible = i < shown;
        const t = !visible ? 0 : i === shown - 1 && state.highlightCol === undefined ? pop(age, fps) : 1;
        const rowHl = state.highlightRow === i;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', minHeight: rowH, height: rowH, borderBottom: `2px solid ${THEME.line}`, opacity: t, transform: `translateX(${(1 - t) * -30}px)`,
            background: rowHl ? `rgba(232,23,223,${0.12 * hl})` : 'transparent' }}>
            <div style={{ width: labelW, font: `800 ${fontCell + 2}px/1.2 ${fonts.sans}`, color: THEME.ink }}>{r.label}</div>
            {r.cells.map((c, j) => {
              const colHl = state.highlightCol === j;
              return (
                <div key={j} style={{ width: colW, alignSelf: 'stretch', display: 'grid', placeItems: 'center', background: colHl ? `rgba(232,23,223,${0.16 * hl})` : 'transparent' }}>
                  {c === '●'
                    ? <div style={{ width: 34, height: 34, borderRadius: 17, background: colHl ? THEME.magenta : THEME.brand, transform: `scale(${colHl ? 1 + 0.25 * hl : 1})` }} />
                    : <div style={{ font: `800 ${fontCell}px/1.2 ${fonts.sans}`, color: c.startsWith('✕') || c === 'Sim' ? THEME.danger : c.startsWith('✓') || c === 'Não' ? THEME.ok : THEME.ink, textAlign: 'center' }}>{c}</div>}
                </div>
              );
            })}
          </div>
        );
      })}
    </Panel>
  );
};
