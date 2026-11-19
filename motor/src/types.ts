// Contrato entre o roteiro de uma aula e o motor de vídeo.
// Três camadas por fala (cue):
//   pedagógica  → `text`  (o que se diz; vira legenda)
//   voz         → `say`   (opcional: versão para o TTS — pronúncia, pausas <pausa 0.4>, ritmo)
//   visual      → `scene`, `beats`, `pose`, `expr`, `look`, `react`, `hold`, `sfx`
// Trocar de motor de voz não exige reescrever cursos: só `say` e o perfil de voz em cast.ts.

export type Speaker = 'lia' | 'teo';
export type Pose = 'neutral' | 'explain' | 'point' | 'wave' | 'raise' | 'think' | 'shrug' | 'celebrate';
export type Expression = 'neutral' | 'happy' | 'excited' | 'surprised' | 'confused' | 'thinking' | 'skeptical' | 'concerned';
export type Look = 'viewer' | 'other' | 'content';
export type Sfx = 'pop' | 'whoosh' | 'ding' | 'dings' | 'error' | 'success' | 'tick';

export type CodeSource = {
  kind: 'code';
  file: string; // relativo a exemplos/
  from?: string; // primeira linha que contém este texto (padrão: início do arquivo)
  title?: string;
  diffAgainst?: string; // linhas novas em relação a este arquivo ganham marca verde
  highlight?: string[]; // destaca linhas que contêm qualquer um destes textos
};

export type CardVariant = 'objective' | 'summary' | 'challenge' | 'next' | 'ticket' | 'rule';

export type Scene =
  | { kind: 'title'; eyebrow: string; title: string; subtitle?: string }
  | { kind: 'talk' }
  | { kind: 'inbox'; count: number; subject: string; note?: string }
  | { kind: 'card'; variant: CardVariant; title: string; items: string[]; shown?: number }
  | { kind: 'quote'; text: string }
  | { kind: 'chart'; xLabel: string; yLabel: string; curves: Array<'healthy' | 'rotten'> }
  | { kind: 'house'; marks: Array<'wall' | 'tv' | 'sink'> }
  | { kind: 'symptoms'; items: Array<{ name: string; desc: string }>; shown: number; focus?: number }
  | CodeSource
  | { kind: 'terminal'; command: string; lines: Array<{ text: string; tone?: 'fail' | 'ok' | 'muted' }> }
  | { kind: 'graph'; nodes: Array<{ id: string; label: string; x: number; y: number; tone?: 'core' | 'infra' | 'ui' | 'soft' }>; edges: Array<{ from: string; to: string; bad?: boolean }>; focusBad?: boolean }
  | { kind: 'versus'; wrong: { title: string; text: string }; right: { title: string; text: string } }
  | { kind: 'table'; title?: string; columns: string[]; rows: Array<{ label: string; cells: string[] }>; shownRows?: number; highlightCol?: number; highlightRow?: number };

// Beat: aplicado quando a narração chega ao k-ésimo `[trecho]`. Campos de cena + chaves especiais:
//   expr / pose  → mudam a expressão/pose de quem fala naquele instante
//   sfx          → toca um efeito naquele instante
export type Beat = Record<string, unknown> & { expr?: Expression; pose?: Pose; sfx?: Sfx };

export type Cue = {
  id: string;
  chapter: number; // índice em Lesson.chapters (1-based)
  speaker: Speaker;
  text: string; // legenda; `[trecho]` marca os beats (se não houver `say`)
  say?: string; // texto para a voz; se tiver `[trecho]`, os beats seguem ESTE texto
  pose?: Pose;
  expr?: Expression;
  look?: Look; // para onde quem fala olha (padrão: 'content' em cena de conteúdo, 'other' em 'talk')
  react?: { expr?: Expression; pose?: Pose; look?: Look }; // quem ESCUTA, durante esta fala
  speed?: number; // (sem efeito com o Qwen3-TTS, que não tem controle de velocidade; use <pausa> no say)
  hold?: { seconds: number; label: string }; // pausa APÓS a fala, com contagem (aluno pensa)
  read?: number | false; // pausa de leitura (s) quando a fala abre um código novo; padrão automático, false desliga
  sfx?: Sfx; // efeito no início da fala
  scene?: Scene; // ausente = herda o estado final da cena anterior
  set?: Record<string, unknown>; // mudanças aplicadas no início da fala
  beats?: Beat[];
};

export type Lesson = {
  course: string;
  number: string;
  slug: string;
  title: string;
  chapters: string[];
  cues: Cue[];
};

// ---- saída do build (o que o Remotion recebe) ----
export type ResolvedCode = {
  kind: 'code';
  title: string;
  lines: Array<{ text: string; added: boolean }>;
  highlight?: string[];
};
export type ResolvedScene = Exclude<Scene, CodeSource> | ResolvedCode;

export type CharacterState = { pose: Pose; expr: Expression; look: Look };

export type ResolvedCue = {
  id: string;
  chapter: number;
  speaker: Speaker;
  text: string;
  scene: ResolvedScene;
  sceneKey: number;
  resetsAtStart: boolean;
  startFrame: number;
  speechFrames: number; // fala propriamente dita
  holdFrames: number; // pausa de "pense" depois da fala
  durationInFrames: number; // fala + pausa + respiro
  hold?: { seconds: number; label: string };
  beats: Beat[];
  beatFrames: number[]; // relativo ao início da fala
  captions: Array<{ text: string; frame: number }>; // trechos de legenda, frame relativo
  chars: Record<Speaker, CharacterState>;
  audio?: string;
  envelope?: number[]; // volume da voz por frame (0..1)
  visemes?: string; // um caractere por frame: X M A E I O U F C
};

export type SfxEvent = { frame: number; sfx: Sfx };

export type LessonProps = {
  fps: number;
  brand?: string; // nome do canal no canto do vídeo (giz.config.json → brand)
  title: string;
  chapters: string[];
  totalFrames: number;
  cues: ResolvedCue[];
  sfx: SfxEvent[];
};
