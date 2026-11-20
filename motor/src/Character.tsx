// Personagens Lia e Téo — rig 2D controlado quadro a quadro (Remotion: nada de CSS animation).
// Partes: corpo (inclinação), braços com ombro + cotovelo, cabeça (inclinação), sobrancelhas, pálpebras,
// olhar (pupila + leve giro do rosto), boca por visema (fonema) × volume, ou boca de expressão em silêncio.
import React from 'react';
import type { Expression, Pose, Speaker } from './types';
import { CAST } from './cast';

const C = {
  skin: '#FDD6B0', skinShade: '#F9C089', ink: '#161616', glasses: '#6D1AE6', brow: '#3A0F78',
  hairA: '#E817DF', hairB: '#6D1AE6', string: '#EDE4FF', jeans: '#3D5A99', jeansCuff: '#5672B0',
  shoe: '#7B2FF2', sole: '#F4F0FF', tongue: '#F06A7A', teeth: '#FFFFFF',
};

// [ombroE, cotoveloE, ombroD, cotoveloD, cabeça, inclinação do corpo] em graus
export const POSES: Record<Pose, number[]> = {
  neutral: [4, -10, -4, 10, 0, 0],
  explain: [24, 62, -24, -62, 0, 0],
  point: [6, -12, -78, -18, 3, 1.5],
  wave: [4, -10, -100, -55, -3, 0],
  raise: [4, -10, -30, -100, -3, 0], // mão na altura do peito ("peraí"), não braço esticado pro alto
  think: [10, -14, 32, 122, 6, 0],
  shrug: [26, 50, -26, -50, 5, 0],
  celebrate: [58, 34, -58, -34, 0, 0], // braços abertos, sem euforia
};
const FRONT_R: Pose[] = ['wave', 'raise', 'think', 'celebrate'];
const FRONT_L: Pose[] = ['celebrate'];

type MouthShape = 'smile' | 'grin' | 'big' | 'o' | 'wavy' | 'flat' | 'smirk' | 'frown';
// sobrancelhas [yE, ânguloE, yD, ânguloD] · pálpebras [cima, baixo] · olhar vertical · boca em silêncio
export const EXPRESSIONS: Record<Expression, { brows: number[]; lids: number[]; eyeDy: number; mouth: MouthShape }> = {
  neutral: { brows: [0, 0, 0, 0], lids: [0.08, 0], eyeDy: 0, mouth: 'smile' },
  happy: { brows: [-5, 0, -5, 0], lids: [0, 0.22], eyeDy: 0, mouth: 'grin' },
  excited: { brows: [-8, 0, -8, 0], lids: [0, 0.18], eyeDy: 0, mouth: 'grin' },
  surprised: { brows: [-17, 0, -17, 0], lids: [0, 0], eyeDy: 0, mouth: 'o' },
  confused: { brows: [-12, 0, 3, -10], lids: [0.1, 0], eyeDy: 0, mouth: 'wavy' },
  thinking: { brows: [-6, 0, 2, -8], lids: [0.3, 0], eyeDy: -6, mouth: 'flat' },
  skeptical: { brows: [4, 7, -11, 6], lids: [0.38, 0.1], eyeDy: 0, mouth: 'smirk' },
  concerned: { brows: [-6, -12, -6, 12], lids: [0.1, 0], eyeDy: 0, mouth: 'frown' },
};

export type Rig = {
  arms: number[]; // 6 valores (POSES)
  brows: number[];
  lids: number[];
  eye: [number, number]; // deslocamento da pupila
  faceDx: number; // leve giro do rosto (3/4)
  mouth: { talking: false; shape: MouthShape } | { talking: true; viseme: string; open: number; shape: MouthShape };
  front: { l: boolean; r: boolean };
  blink: number; // 0..1
  bob: number; // movimento da cabeça ao falar
  waveFrame?: number;
};

export const frontFor = (pose: Pose) => ({ l: FRONT_L.includes(pose), r: FRONT_R.includes(pose) });

const star = (cx: number, cy: number, s: number) =>
  `M${cx},${cy - s} Q${cx},${cy} ${cx + s},${cy} Q${cx},${cy} ${cx},${cy + s} Q${cx},${cy} ${cx - s},${cy} Q${cx},${cy} ${cx},${cy - s}Z`;

const Hair: React.FC<{ who: Speaker; fill: string }> = ({ who, fill }) =>
  who === 'lia' ? (
    <g fill={fill}>
      <circle cx="285" cy="62" r="52" />
      <path d="M78,182 C60,95 130,48 205,50 C285,52 330,105 322,190 C318,160 300,138 282,132 L296,214 C262,206 238,180 232,140 C190,180 130,196 78,182 Z" />
      <path d="M78,182 C70,150 40,140 30,150 C50,158 62,170 78,182 Z" />
    </g>
  ) : (
    <g fill={fill}>
      <path d="M82,188 C62,100 120,40 200,42 C250,30 300,52 318,96 C336,120 330,160 320,196 C314,168 300,150 286,142 C294,128 296,118 292,104 C262,136 200,140 150,146 C120,150 96,166 82,188 Z" />
      <path d="M150,58 C170,20 220,14 252,30 C226,30 206,40 196,56 Z" />
      <path d="M286,74 C312,62 336,74 342,100 C326,88 310,86 300,92 Z" />
      <path d="M300,128 C322,130 336,150 334,176 C324,160 312,152 304,152 Z" />
    </g>
  );

// Braço: capsula superior (ombro → cotovelo) + antebraço (cotovelo → mão), cada um com seu pivô.
const Arm: React.FC<{ side: 'l' | 'r'; shoulder: number; elbow: number; hoodie: string; shade: string }> = ({ side, shoulder, elbow, hoodie, shade }) => {
  const [px, base] = side === 'l' ? [134, 8] : [266, -8];
  return (
    <g transform={`translate(${px} 306) rotate(${base + shoulder})`}>
      <rect x="-17" y="-12" width="34" height="68" rx="17" fill={hoodie} />
      <g transform={`translate(0 52) rotate(${elbow})`}>
        <rect x="-15" y="-10" width="30" height="58" rx="15" fill={hoodie} />
        <rect x="-16" y="40" width="32" height="12" rx="6" fill={shade} />
        <circle cx="0" cy="62" r="16" fill={C.skin} />
      </g>
    </g>
  );
};

function Mouth({ m, smileW }: { m: Rig['mouth']; smileW: number }) {
  const stroke = { fill: 'none', stroke: C.ink, strokeWidth: 6, strokeLinecap: 'round' as const };
  const base = (shape: MouthShape) => {
    switch (shape) {
      case 'smile': return <path {...stroke} d={`M${200 - smileW / 2},238 Q200,254 ${200 + smileW / 2},238`} />;
      case 'grin': return <g><path fill={C.ink} d="M182,236 Q200,238 218,236 Q214,262 200,262 Q186,262 182,236 Z" /><path fill={C.tongue} d="M190,254 Q200,248 210,254 Q205,261 200,261 Q195,261 190,254 Z" /></g>;
      case 'big': return <g><path fill={C.ink} d="M176,234 Q200,237 224,234 Q220,270 200,270 Q180,270 176,234 Z" /><path fill={C.tongue} d="M187,258 Q200,250 213,258 Q207,268 200,268 Q193,268 187,258 Z" /><rect x="186" y="235" width="28" height="7" rx="3" fill={C.teeth} /></g>;
      case 'o': return <ellipse cx="200" cy="246" rx="10" ry="13" fill={C.ink} />;
      case 'wavy': return <path {...stroke} d="M184,245 q8,-7 16,0 t16,0" />;
      case 'flat': return <path {...stroke} d="M192,245 L214,241" />;
      case 'smirk': return <path {...stroke} d="M186,245 Q204,248 216,236" />;
      case 'frown': return <path {...stroke} d="M186,249 Q200,238 214,249" />;
    }
  };
  if (!m.talking || m.viseme === 'X') return base(m.shape);
  const o = Math.max(0.25, Math.min(1, m.open));
  const v = m.viseme;
  if (v === 'M') return <path {...stroke} d="M189,243 L211,243" />;
  const dims: Record<string, [number, number]> = {
    A: [15, 4 + 15 * o], E: [17, 3 + 9 * o], I: [16, 2 + 6 * o], O: [10, 6 + 10 * o],
    U: [7, 5 + 6 * o], F: [14, 5], C: [13, 3 + 8 * o],
  };
  const [rx, ry] = dims[v] ?? dims.C;
  const cy = 242 + ry * 0.35;
  return (
    <g>
      <ellipse cx="200" cy={cy} rx={rx} ry={ry} fill={C.ink} />
      {(v === 'I' || v === 'E' || v === 'F') && <rect x={200 - rx * 0.7} y={cy - ry} width={rx * 1.4} height={Math.min(6, ry * 0.8)} rx="2" fill={C.teeth} />}
      {(v === 'A' || v === 'O') && ry > 9 && <ellipse cx="200" cy={cy + ry * 0.5} rx={rx * 0.6} ry={ry * 0.35} fill={C.tongue} />}
    </g>
  );
}

export const Character: React.FC<{ who: Speaker; width: number; frame: number; fps: number; rig: Rig; uid: string }> = ({ who, width, frame, fps, rig, uid }) => {
  const look = CAST[who].look;
  const seed = who === 'lia' ? 0 : 61;
  const breathe = Math.sin(((frame + seed) / fps) * ((2 * Math.PI) / 3.4)) * 2.5;
  const sway = Math.sin(((frame + seed * 3) / fps) * ((2 * Math.PI) / 7)) * 0.8; // troca de apoio sutil
  const [shL, elL, shR, elR, headTilt, lean] = rig.arms;
  const wave = rig.waveFrame !== undefined ? Math.sin((rig.waveFrame / fps) * Math.PI * 3.2) * 14 : 0;
  const top = Math.max(rig.lids[0], rig.blink);
  const bottom = rig.lids[1];
  const [ex, ey] = rig.eye;

  const eye = (cx: number, side: 'l' | 'r', s1: [number, number], s2: [number, number]) => (
    <g>
      <clipPath id={`${uid}-eye-${side}`}><circle cx={cx} cy="196" r="25" /></clipPath>
      <g transform={`translate(${ex} ${ey})`}>
        <circle cx={cx} cy="196" r="24" fill={C.ink} />
        <path fill="#F2F2F2" d={star(s1[0], s1[1], 10)} />
        <path fill="#F2F2F2" d={star(s2[0], s2[1], 5)} />
      </g>
      <g clipPath={`url(#${uid}-eye-${side})`}>
        <rect x={cx - 30} y={171} width="60" height={50 * top + 0.01} fill={C.skin} />
        <rect x={cx - 30} y={221 - 50 * bottom} width="60" height={50 * bottom + 0.01} fill={C.skin} />
        {top > 0.15 && <line x1={cx - 26} x2={cx + 26} y1={171 + 50 * top} y2={171 + 50 * top} stroke={C.ink} strokeWidth="4" strokeLinecap="round" />}
      </g>
    </g>
  );
  const brow = (cx: number, y: number, a: number, flip: number) => (
    <path transform={`translate(${cx} ${136 + y}) rotate(${a})`} d={`M-24,${look.brow.arch * 0.3} Q0,${-look.brow.arch} 24,${look.brow.arch * 0.3 * flip}`}
      fill="none" stroke={C.brow} strokeWidth={look.brow.width} strokeLinecap="round" />
  );
  const armL = <Arm side="l" shoulder={shL} elbow={elL} hoodie={look.hoodie} shade={look.hoodieShade} />;
  const armR = <Arm side="r" shoulder={shR} elbow={elR + wave} hoodie={look.hoodie} shade={look.hoodieShade} />;

  return (
    <svg viewBox="0 0 400 600" width={width} height={(width * 600) / 400} style={{ overflow: 'visible' }} role="img" aria-label={CAST[who].name}>
      <defs>
        <linearGradient id={`${uid}-hair`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.hairA} />
          <stop offset="1" stopColor={C.hairB} />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="585" rx={110 - breathe} ry="10" fill="#2a0a5e" opacity=".12" />
      <g transform={`rotate(${lean + sway} 200 575) translate(0 ${breathe - 2})`}>
        <g>
          <path fill={C.jeans} d="M140,410 h56 l-4,120 h-46 Z" />
          <path fill={C.jeans} d="M204,410 h56 l-6,120 h-46 Z" />
          <rect x="142" y="512" width="54" height="20" rx="6" fill={C.jeansCuff} />
          <rect x="204" y="512" width="54" height="20" rx="6" fill={C.jeansCuff} />
          <path fill={who === 'teo' ? C.sole : C.shoe} d="M130,556 C130,538 150,530 170,530 C186,530 196,538 196,550 L196,562 H134 Z" />
          <path fill={who === 'teo' ? C.sole : C.shoe} d="M204,550 C204,538 214,530 230,530 C250,530 270,538 270,556 L266,562 H204 Z" />
          <rect x="128" y="558" width="70" height="12" rx="6" fill={who === 'teo' ? look.hoodie : C.sole} />
          <rect x="202" y="558" width="70" height="12" rx="6" fill={who === 'teo' ? look.hoodie : C.sole} />
        </g>
        <path fill={look.hoodie} d="M126,296 C150,282 250,282 274,296 C286,330 286,390 280,420 C240,432 160,432 120,420 C114,390 114,330 126,296 Z" />
        <path fill={look.hoodieShade} d="M150,370 h100 l-8,40 h-84 Z" opacity=".55" />
        <path fill={look.hoodieShade} d="M150,288 C170,312 230,312 250,288 C232,300 168,300 150,288 Z" />
        <path stroke={C.string} strokeWidth="4" strokeLinecap="round" d="M184,304 v34 M216,304 v34" />
        <circle cx="184" cy="340" r="4" fill={C.string} /><circle cx="216" cy="340" r="4" fill={C.string} />
        {look.emblem === 'star'
          ? <path fill="#FFD54A" d={star(246, 336, 11)} />
          : <text x="200" y="398" textAnchor="middle" fontFamily="monospace" fontWeight="900" fontSize="26" fill="#C9B8FF">{'</>'}</text>}
        {!rig.front.l && armL}
        {!rig.front.r && armR}
        <g transform={`rotate(${headTilt + rig.bob} 200 290) translate(0 ${-Math.abs(rig.bob) * 0.8})`}>
          <circle cx={92 - rig.faceDx * 0.4} cy="200" r="27" fill={C.skin} />
          <circle cx={92 - rig.faceDx * 0.4} cy="200" r="14" fill={C.skinShade} />
          <circle cx={308 - rig.faceDx * 0.4} cy="200" r="27" fill={C.skin} />
          <circle cx={308 - rig.faceDx * 0.4} cy="200" r="14" fill={C.skinShade} />
          <ellipse cx="200" cy="180" rx="114" ry="116" fill={C.skin} />
          <path fill={C.skinShade} d="M92,200 C100,260 140,292 200,296 C150,280 112,250 92,200 Z" />
          <g transform={`translate(${rig.faceDx} 0)`}>
            <ellipse cx="128" cy="238" rx="16" ry="9" fill="#F79AA8" opacity=".45" />
            <ellipse cx="272" cy="238" rx="16" ry="9" fill="#F79AA8" opacity=".45" />
            {eye(152, 'l', [156, 190], [144, 205])}
            {eye(248, 'r', [244, 190], [257, 205])}
            <g fill="none" stroke={C.glasses} strokeWidth="6">
              <circle cx="152" cy="196" r="42" />
              <circle cx="248" cy="196" r="42" />
              <path d="M192,188 C196,180 204,180 208,188" />
              <path d="M110,192 L92,186 M290,192 L308,186" />
            </g>
            <Mouth m={rig.mouth} smileW={look.smile} />
          </g>
          <Hair who={who} fill={`url(#${uid}-hair)`} />
          <g transform={`translate(${rig.faceDx} 0)`}>
            {brow(152, rig.brows[0], rig.brows[1], 1)}
            {brow(248, rig.brows[2], rig.brows[3], 1)}
          </g>
        </g>
        {rig.front.l && armL}
        {rig.front.r && armR}
      </g>
    </svg>
  );
};
