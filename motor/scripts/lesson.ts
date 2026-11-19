// Build de uma aula: roteiro.ts + exemplos/ + audio/timings.json  →  public/<aula>/props.json + roteiro.md + legendas.srt
// Uso: node scripts/lesson.ts build ../cursos/solid/aulas/01-por-que-codigo-apodrece
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { captionChunks } from '../src/captions.ts';
import { CAST, OTHER } from '../src/cast.ts';
import type { Lesson, Cue, Scene, ResolvedCue, ResolvedScene, LessonProps, Speaker, SfxEvent, CharacterState } from '../src/types.ts';
import { spokenText, type Timings, type Segment } from './tts.ts';

const FPS = 30;
const WORDS_PER_SECOND = 2.45; // estimativa usada só enquanto não há áudio
const GAP_SECONDS = 0.3; // respiro entre falas
// Código novo na tela ganha pausa de leitura: ~0,35 s por linha, entre 4 e 9 s (+1 s se houver diff).
const READ_PER_LINE = 0.35, READ_MIN = 4, READ_MAX = 9;
function readingSeconds(scene: ResolvedScene, hasDiff: boolean): number {
  if (scene.kind !== 'code') return 0;
  const lines = scene.lines.filter((l) => l.text.trim()).length;
  return Math.min(READ_MAX, Math.max(READ_MIN, Math.round(lines * READ_PER_LINE))) + (hasDiff ? 1 : 0);
}

const MARK = /\[([^\]]+)\]/g;
const cleanText = (t: string) => spokenText(t);

// posição (em caracteres do texto limpo) de cada [trecho]
function markerOffsets(raw: string): number[] {
  const noPause = raw.replace(/<pausa\s+[\d.]+>/g, '').replace(/\s{2,}/g, ' ').trim();
  const out: number[] = [];
  let removed = 0;
  for (const m of noPause.matchAll(MARK)) { out.push(m.index! - removed); removed += 2; }
  return out;
}

function charToFrame(off: number, len: number, segments: Segment[] | undefined, speechFrames: number): number {
  if (segments?.length) {
    for (const s of segments) {
      if (off < s.c0) return s.f0;
      if (off <= s.c1) return Math.round(s.f0 + ((off - s.c0) / Math.max(1, s.c1 - s.c0)) * (s.f1 - s.f0));
    }
    return segments.at(-1)!.f1;
  }
  return Math.round((off / Math.max(1, len)) * speechFrames);
}

function resolveCode(scene: Extract<Scene, { kind: 'code' }>, examplesDir: string): ResolvedScene {
  const read = (f: string) => readFileSync(join(examplesDir, f), 'utf8').replace(/\s+$/, '').split('\n');
  const all = read(scene.file);
  const start = scene.from ? all.findIndex((l) => l.includes(scene.from!)) : 0;
  if (start < 0) throw new Error(`"${scene.from}" não encontrado em ${scene.file}`);
  const before = scene.diffAgainst ? new Set(read(scene.diffAgainst).map((l: string) => l.trim())) : null;
  return {
    kind: 'code',
    title: scene.title ?? scene.file,
    highlight: scene.highlight ?? [],
    lines: all.slice(start).map((text) => ({ text, added: !!before && text.trim() !== '' && !before.has(text.trim()) })),
  };
}

export async function build(lessonDirArg: string) {
  const lessonDir = resolve(lessonDirArg);
  const { lesson } = (await import(pathToFileURL(join(lessonDir, 'roteiro.ts')).href)) as { lesson: Lesson };
  const timingsPath = join(lessonDir, 'audio', 'timings.json');
  const timings: Timings = existsSync(timingsPath) ? JSON.parse(readFileSync(timingsPath, 'utf8')) : {};
  const outKey = `${lesson.course}-${lesson.number}`;
  const publicRoot = resolve(import.meta.dirname, '..', 'public');
  const publicDir = join(publicRoot, outKey);
  mkdirSync(publicDir, { recursive: true });
  mkdirSync(join(publicRoot, 'sfx'), { recursive: true });
  const sfxSrc = resolve(import.meta.dirname, '..', 'assets', 'sfx');
  if (existsSync(sfxSrc)) for (const f of readdirSync(sfxSrc)) copyFileSync(join(sfxSrc, f), join(publicRoot, 'sfx', f));

  let frame = 0;
  let state: Record<string, unknown> | null = null;
  let sceneKey = -1;
  const cues: ResolvedCue[] = [];
  const sfx: SfxEvent[] = [];
  const missingAudio: string[] = [];

  for (const cue of lesson.cues) {
    if (!lesson.chapters[cue.chapter - 1]) throw new Error(`cue ${cue.id}: capítulo ${cue.chapter} não existe`);
    const newScene = !!cue.scene;
    if (cue.scene) {
      state = (cue.scene.kind === 'code' ? resolveCode(cue.scene, join(lessonDir, 'exemplos')) : { ...cue.scene }) as Record<string, unknown>;
      sceneKey++;
    } else if (!state) throw new Error(`cue ${cue.id}: primeira fala precisa de cena`);
    if (cue.set) state = { ...state, ...cue.set };
    const stage = (state as { kind: string }).kind === 'talk';

    const raw = cue.say ?? cue.text;
    const spoken = cleanText(raw);
    const caption = cleanText(cue.text);
    const t = timings[cue.id];
    const fresh = !!t && t.spoken === spoken;
    let speechFrames: number;
    let audio: string | undefined;
    if (fresh) {
      speechFrames = Math.ceil(t.durationSec * FPS);
      audio = `${outKey}/${basename(t.file)}`;
      copyFileSync(join(lessonDir, 'audio', t.file), join(publicDir, basename(t.file)));
    } else {
      missingAudio.push(cue.id);
      speechFrames = Math.ceil((spoken.split(/\s+/).length / WORDS_PER_SECOND) * FPS);
    }
    // pausa: explícita (hold) e/ou de leitura de código novo — vale a maior
    const autoRead = newScene && cue.read !== false
      ? (typeof cue.read === 'number' ? cue.read : readingSeconds(state as ResolvedScene, cue.scene?.kind === 'code' && !!cue.scene.diffAgainst))
      : 0;
    const hold = cue.hold
      ? { ...cue.hold, seconds: Math.max(cue.hold.seconds, autoRead) }
      : autoRead > 0 ? { seconds: autoRead, label: 'Leia o código' } : undefined;
    const holdFrames = Math.round((hold?.seconds ?? 0) * FPS);
    // grafo: toda seta precisa ligar nós que existem (em todo estado: início e após cada beat)
    for (const st of [state, ...(cue.beats ?? []).map((bt) => ({ ...state, ...bt }))] as Array<Record<string, unknown>>) {
      if (st.kind !== 'graph') continue;
      const ids = new Set((st.nodes as Array<{ id: string }>).map((n) => n.id));
      for (const e of st.edges as Array<{ from: string; to: string }>)
        if (!ids.has(e.from) || !ids.has(e.to)) throw new Error(`cue ${cue.id}: seta ${e.from}→${e.to} liga nó inexistente (nós: ${[...ids].join(', ')})`);
    }
    const durationInFrames = speechFrames + holdFrames + Math.round(GAP_SECONDS * FPS);

    // beats: marcas no `say` (se houver) ou no `text`
    const markSrc = cue.say && /\[[^\]]+\]/.test(cue.say) ? cue.say : cue.text;
    const offsets = markerOffsets(markSrc);
    if ((cue.beats?.length ?? 0) !== offsets.length) {
      throw new Error(`cue ${cue.id}: ${offsets.length} [marcas] no texto, mas ${cue.beats?.length ?? 0} beats`);
    }
    const segs = fresh && markSrc === raw ? t.segments : undefined;
    const markLen = cleanText(markSrc).length;
    const beatFrames = offsets.map((o) => charToFrame(o, markLen, segs, speechFrames));

    const capSegs = fresh && !cue.say ? t.segments : undefined;
    const captions = captionChunks(caption).map((c) => ({ text: c.text, frame: charToFrame(Math.round(c.at * caption.length), caption.length, capSegs, speechFrames) }));

    const listener = OTHER[cue.speaker];
    const chars = {
      [cue.speaker]: { pose: cue.pose ?? 'neutral', expr: cue.expr ?? CAST[cue.speaker].defaultExpr, look: cue.look ?? (stage ? 'other' : 'content') },
      [listener]: { pose: cue.react?.pose ?? 'neutral', expr: cue.react?.expr ?? CAST[listener].idleExpr, look: cue.react?.look ?? 'other' },
    } as Record<Speaker, CharacterState>;

    if (newScene && cues.length) sfx.push({ frame, sfx: 'whoosh' });
    if (cue.sfx) sfx.push({ frame, sfx: cue.sfx });
    (cue.beats ?? []).forEach((b, k) => { if (b.sfx) sfx.push({ frame: frame + beatFrames[k], sfx: b.sfx }); });
    if (cue.hold) for (let s = 0; s < hold!.seconds; s++) sfx.push({ frame: frame + speechFrames + s * FPS, sfx: 'tick' }); // tique só em pausa de desafio

    cues.push({
      id: cue.id, chapter: cue.chapter, speaker: cue.speaker, text: caption,
      scene: state as ResolvedScene, sceneKey, resetsAtStart: !!cue.set,
      startFrame: frame, speechFrames, holdFrames, durationInFrames, hold,
      beats: cue.beats ?? [], beatFrames, captions, chars,
      audio, envelope: fresh ? t.envelope : undefined, visemes: fresh ? t.visemes : undefined,
    });

    for (const b of cue.beats ?? []) {
      const { expr: _e, pose: _p, sfx: _s, ...rest } = b;
      state = { ...state, ...rest };
    }
    frame += durationInFrames;
  }

  const props: LessonProps = { fps: FPS, title: lesson.title, chapters: lesson.chapters, totalFrames: frame + FPS, cues, sfx };
  writeFileSync(join(publicDir, 'props.json'), JSON.stringify(props));
  writeFileSync(join(lessonDir, 'roteiro.md'), toMarkdown(lesson, cues, FPS));
  mkdirSync(join(lessonDir, 'render'), { recursive: true });
  writeFileSync(join(lessonDir, 'render', 'legendas.srt'), toSrt(cues, FPS));
  return { lesson, props, publicDir, missingAudio };
}

// Legenda .srt (YouTube e qualquer player): os mesmos trechos e tempos da legenda gravada no vídeo.
function toSrt(cues: ResolvedCue[], fps: number): string {
  const ts = (f: number) => {
    const ms = Math.round((f / fps) * 1000);
    const p = (n: number, w = 2) => String(n).padStart(w, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  const out: string[] = [];
  for (const c of cues) {
    c.captions.forEach((ch, k) => {
      const a = c.startFrame + ch.frame;
      const b = c.startFrame + (k + 1 < c.captions.length ? c.captions[k + 1].frame : c.speechFrames);
      out.push(`${out.length + 1}\n${ts(a)} --> ${ts(b)}\n${CAST[c.speaker].name}: ${ch.text}\n`);
    });
  }
  return out.join('\n');
}

const mmss = (f: number, fps: number) => {
  const s = Math.floor(f / fps);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function describe(scene: Cue['scene']): string {
  if (!scene) return '(continua)';
  switch (scene.kind) {
    case 'code': return `código \`${scene.file}\`${scene.diffAgainst ? ` (novidades em verde vs \`${scene.diffAgainst}\`)` : ''}`;
    case 'card': return `cartão "${scene.title}"`;
    case 'talk': return 'Lia e Téo conversando';
    default: return scene.kind;
  }
}

function toMarkdown(lesson: Lesson, cues: ResolvedCue[], fps: number): string {
  const total = cues.at(-1)!.startFrame + cues.at(-1)!.durationInFrames;
  const words = cues.reduce((n, c) => n + c.text.split(/\s+/).length, 0);
  const scenes = new Set(cues.map((c) => c.sceneKey)).size;
  let md = `# Roteiro: Aula ${lesson.number} · ${lesson.title}\n\n`;
  md += `> GERADO de \`roteiro.ts\` — edite lá e rode o build. ${cues.length} falas · ${words} palavras · ${scenes} cenas · duração ${mmss(total, fps)}`;
  md += ` · uma cena nova a cada ${(total / fps / scenes).toFixed(0)} s em média\n`;
  md += `> \`[trecho]\` = momento da ação visual. "voz:" aparece quando o texto falado difere da legenda.\n`;
  let chapter = 0;
  lesson.cues.forEach((cue, i) => {
    if (cue.chapter !== chapter) { chapter = cue.chapter; md += `\n## ${chapter} · ${lesson.chapters[chapter - 1]}\n`; }
    const who = CAST[cue.speaker].name;
    const dir = [cue.expr, cue.pose].filter(Boolean).join(', ');
    const other = cue.react ? ` · ${CAST[OTHER[cue.speaker]].name} reage: ${[cue.react.expr, cue.react.pose].filter(Boolean).join(', ')}` : '';
    md += `\n**${cue.id}** · ${mmss(cues[i].startFrame, fps)} · **${who}**${dir ? ` (${dir})` : ''}${other} · tela: ${describe(cue.scene)}\n\n`;
    md += `> ${cue.text}\n`;
    if (cue.say) md += `>\n> _voz:_ ${cue.say}\n`;
    if (cues[i].hold) md += `>\n> ⏸ ${cues[i].hold!.seconds}s — "${cues[i].hold!.label}"\n`;
  });
  return md;
}

if (process.argv[1] === import.meta.filename) {
  const [cmd, dir] = process.argv.slice(2);
  if (cmd !== 'build' || !dir) { console.error('uso: node scripts/lesson.ts build <pasta-da-aula>'); process.exit(2); }
  const { props, publicDir, missingAudio } = await build(dir);
  console.log(`ok: ${props.cues.length} falas, ${(props.totalFrames / props.fps / 60).toFixed(1)} min → ${publicDir}/props.json`);
  if (missingAudio.length) console.log(`aviso: ${missingAudio.length} falas sem áudio atualizado (duração estimada): ${missingAudio.join(' ')}`);
}
