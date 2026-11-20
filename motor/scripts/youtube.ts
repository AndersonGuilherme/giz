// Publica as aulas renderizadas no YouTube: vídeo, capa, legendas e playlist do curso.
// Sem dependências: fala direto com a YouTube Data API v3 (OAuth de app instalado, com redirecionamento local).
//
// Preparação (uma vez por pessoa, nada disso vai para o repositório) — passo a passo completo no README, seção
// "Publique no YouTube":
//   1. Google Cloud Console: ative a "YouTube Data API v3", configure a tela de consentimento OAuth (Externo) com a
//      conta do canal em "Usuários de teste", crie um ID do cliente OAuth do tipo "App para computador" e salve o
//      JSON em ~/.config/giz/youtube/client_secret.json (ou aponte GIZ_YOUTUBE_CLIENT_SECRET para ele).
//   2. npm run youtube -- login            → mostra o link de autorização e guarda o token em ~/.config/giz/youtube/
//
// Uso:
//   npm run youtube -- publicar <pasta-da-aula> [--privacidade private|unlisted|public] [--forcar]
//   npm run youtube -- pendentes <pasta-do-curso> [--privacidade ...] [--vigiar]
//       publica, em ordem, toda aula com render pronto e ainda não publicada; --vigiar repete a cada 5 min
//   npm run youtube -- status <pasta-do-curso>
//   npm run youtube -- simular <pasta-da-aula>       → mostra título, descrição e capa, sem enviar nada
//
// O que vai em cada vídeo: título "<título da aula> | Aula NNN", descrição com subtítulo, capítulos (marcas de tempo)
// e aviso de conteúdo sintético; legendas.srt; capa "Aula NNN - ….png/jpg" da pasta `capas` do curso.yaml
// (padrão: <curso>/capas); playlist com o título do curso (criada se não existir). O resultado fica em
// render/youtube.json — aula com esse arquivo não é publicada de novo (use --forcar).
//
// Limites do YouTube que você precisa conhecer:
//   - Cota diária padrão de 10.000 unidades; um envio completo gasta ~2.100 (vídeo 1.600, legenda 400, capa 50,
//     playlist 50): cerca de 4 aulas por dia. Ao bater na cota, o script para e o --vigiar tenta de novo depois.
//   - Projetos de API não verificados pelo Google têm os vídeos enviados travados como privados até passarem
//     pela auditoria de conformidade da API. Por isso o padrão aqui é --privacidade private.
//   - Capa personalizada exige canal verificado (verificação por telefone no YouTube).
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Lesson } from '../src/types.ts';

const DIR = join(homedir(), '.config', 'giz', 'youtube');
const CLIENT = process.env.GIZ_YOUTUBE_CLIENT_SECRET ?? join(DIR, 'client_secret.json');
const TOKEN = join(DIR, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.force-ssl'];
const API = 'https://www.googleapis.com/youtube/v3';
const UPLOAD = 'https://www.googleapis.com/upload/youtube/v3';
const FPS = 30;

type Privacidade = 'private' | 'unlisted' | 'public';
type Token = { access_token: string; refresh_token: string; expires_at: number };

class Cota extends Error {}

// ── autenticação ─────────────────────────────────────────────────────────────
function client() {
  if (!existsSync(CLIENT)) {
    console.error(`Falta a credencial OAuth em ${CLIENT}.\nVeja a preparação no topo de motor/scripts/youtube.ts.`);
    process.exit(2);
  }
  const j = JSON.parse(readFileSync(CLIENT, 'utf8'));
  const c = j.installed ?? j.web;
  return { id: c.client_id as string, secret: c.client_secret as string };
}

function saveToken(t: Token) {
  mkdirSync(DIR, { recursive: true, mode: 0o700 });
  writeFileSync(TOKEN, JSON.stringify(t));
  chmodSync(TOKEN, 0o600);
}

async function login() {
  const { id, secret } = client();
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(12).toString('hex');
  const code = await new Promise<{ code: string; redirect: string }>((ok, fail) => {
    const srv = createServer((req, res) => {
      const u = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (u.pathname !== '/') { res.writeHead(404).end(); return; }
      const c = u.searchParams.get('code');
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(c ? 'Pronto! Pode fechar esta aba.' : 'Autorização recusada.');
      srv.close();
      if (!c || u.searchParams.get('state') !== state) fail(new Error('autorização recusada ou estado inválido'));
      else ok({ code: c, redirect });
    });
    let redirect = '';
    srv.listen(0, '127.0.0.1', () => {
      redirect = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.search = new URLSearchParams({
        client_id: id, redirect_uri: redirect, response_type: 'code', scope: SCOPES.join(' '),
        access_type: 'offline', prompt: 'consent', code_challenge: challenge, code_challenge_method: 'S256', state,
      }).toString();
      console.log(`Abra no navegador e autorize com a conta do canal:\n\n${url}\n`);
    });
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ code: code.code, client_id: id, client_secret: secret, redirect_uri: code.redirect, grant_type: 'authorization_code', code_verifier: verifier }),
  });
  const j = await r.json();
  if (!r.ok || !j.refresh_token) throw new Error(`falha no login: ${JSON.stringify(j)}`);
  saveToken({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + j.expires_in * 1000 });
  console.log(`Token salvo em ${TOKEN}.`);
}

async function accessToken(): Promise<string> {
  if (!existsSync(TOKEN)) { console.error('Faça o login antes: npm run youtube -- login'); process.exit(2); }
  const t: Token = JSON.parse(readFileSync(TOKEN, 'utf8'));
  if (t.expires_at - 60_000 > Date.now()) return t.access_token;
  const { id, secret } = client();
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: t.refresh_token, grant_type: 'refresh_token' }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`não consegui renovar o token (refaça o login): ${JSON.stringify(j)}`);
  saveToken({ ...t, access_token: j.access_token, expires_at: Date.now() + j.expires_in * 1000 });
  return j.access_token;
}

async function api(url: string, init: RequestInit = {}): Promise<Response> {
  const r = await fetch(url, { ...init, headers: { authorization: `Bearer ${await accessToken()}`, ...(init.headers ?? {}) } });
  if (!r.ok && r.status !== 308) {
    const body = await r.text();
    if (/quotaExceeded|uploadLimitExceeded|rateLimitExceeded/.test(body)) throw new Cota(body);
    throw new Error(`${init.method ?? 'GET'} ${url.split('?')[0]} → ${r.status}: ${body}`);
  }
  return r;
}

// ── metadados da aula ────────────────────────────────────────────────────────
const yamlValue = (yaml: string, key: string) => /^\s*"?(.*?)"?\s*$/.exec(new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(yaml)?.[1] ?? '')?.[1] ?? '';

function cursoDe(aulaDir: string) {
  const dir = resolve(aulaDir, '..', '..');
  const yaml = existsSync(join(dir, 'curso.yaml')) ? readFileSync(join(dir, 'curso.yaml'), 'utf8') : '';
  return { dir, titulo: yamlValue(yaml, 'title') || basename(dir), capas: join(dir, yamlValue(yaml, 'capas') || 'capas'), tags: yamlValue(yaml, 'youtube_tags') };
}

const mmss = (frames: number) => { const s = Math.floor(frames / FPS); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

async function metadados(aulaDir: string) {
  const { lesson } = (await import(pathToFileURL(join(aulaDir, 'roteiro.ts')).href)) as { lesson: Lesson };
  const curso = cursoDe(aulaDir);
  const propsPath = resolve(import.meta.dirname, '..', 'public', `${lesson.course}-${lesson.number}`, 'props.json');
  const linhas: string[] = [];
  const titulo = lesson.cues.map((c) => c.scene).find((s) => s?.kind === 'title') as { subtitle?: string } | undefined;
  if (titulo?.subtitle) linhas.push(titulo.subtitle, '');
  if (existsSync(propsPath)) {
    // capítulos: o YouTube exige o primeiro em 0:00, pelo menos três, cada um com 10 s ou mais
    const props = JSON.parse(readFileSync(propsPath, 'utf8')) as { cues: Array<{ chapter: number; startFrame: number }> };
    const inicio = new Map<number, number>();
    for (const c of props.cues) if (!inicio.has(c.chapter)) inicio.set(c.chapter, c.startFrame);
    const caps = [...inicio.entries()].sort((a, b) => a[1] - b[1]).map(([ch, f], k) => ({ nome: lesson.chapters[ch - 1], f: k === 0 ? 0 : f }));
    const longos = caps.filter((c, k) => k === caps.length - 1 || caps[k + 1].f - c.f >= 10 * FPS);
    if (longos.length >= 3) linhas.push('Capítulos', ...longos.map((c) => `${mmss(c.f)} ${c.nome}`), '');
  }
  linhas.push(`Curso: ${curso.titulo} · Aula ${lesson.number}`, '', 'Vozes e personagens desta aula são gerados por computador.');
  return {
    lesson, curso,
    title: `${lesson.title} | Aula ${lesson.number}`.slice(0, 100),
    description: linhas.join('\n').slice(0, 4900),
    tags: curso.tags ? curso.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  };
}

function capa(capasDir: string, numero: string): string | undefined {
  if (!existsSync(capasDir)) return undefined;
  const f = readdirSync(capasDir).find((n) => n.startsWith(`Aula ${numero}`) && /\.(png|jpe?g)$/i.test(n));
  return f && join(capasDir, f);
}

// ── envio ────────────────────────────────────────────────────────────────────
async function playlistDoCurso(titulo: string): Promise<string> {
  let pageToken = '';
  do {
    const j = await (await api(`${API}/playlists?part=snippet&mine=true&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}`)).json();
    const p = j.items?.find((i: { snippet: { title: string } }) => i.snippet.title === titulo);
    if (p) return p.id;
    pageToken = j.nextPageToken ?? '';
  } while (pageToken);
  const r = await api(`${API}/playlists?part=snippet,status`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ snippet: { title: titulo, defaultLanguage: 'pt-BR' }, status: { privacyStatus: 'public' } }),
  });
  return (await r.json()).id;
}

async function publicar(aulaDir: string, privacidade: Privacidade, forcar = false) {
  aulaDir = resolve(aulaDir);
  const marca = join(aulaDir, 'render', 'youtube.json');
  if (existsSync(marca) && !forcar) { console.log(`já publicada: ${JSON.parse(readFileSync(marca, 'utf8')).url}`); return; }
  const m = await metadados(aulaDir);
  const video = join(aulaDir, 'render', `aula-${m.lesson.number}.mp4`);
  const srt = join(aulaDir, 'render', 'legendas.srt');
  if (!existsSync(video)) throw new Error(`sem vídeo renderizado: ${video}`);

  console.log(`▶ ${m.title} (${privacidade})`);
  const bytes = readFileSync(video);
  const ini = await api(`${UPLOAD}/videos?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=UTF-8', 'x-upload-content-type': 'video/mp4', 'x-upload-content-length': String(bytes.length) },
    body: JSON.stringify({
      snippet: { title: m.title, description: m.description, tags: m.tags, categoryId: '27', defaultLanguage: 'pt-BR', defaultAudioLanguage: 'pt-BR' },
      status: { privacyStatus: privacidade, selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
    }),
  });
  const sessao = ini.headers.get('location');
  if (!sessao) throw new Error('o YouTube não devolveu a sessão de envio');
  const up = await api(sessao, { method: 'PUT', headers: { 'content-type': 'video/mp4' }, body: bytes });
  const id = (await up.json()).id as string;
  const url = `https://youtu.be/${id}`;
  const feito: Record<string, unknown> = { videoId: id, url, privacidade, enviadoEm: new Date().toISOString(), tamanho: bytes.length };
  writeFileSync(marca, JSON.stringify(feito, null, 2)); // grava já: se um passo abaixo falhar, o vídeo não é reenviado
  console.log(`  vídeo: ${url}`);

  const passos: Array<[string, () => Promise<unknown>]> = [
    ['legendas', async () => {
      if (!existsSync(srt)) return 'sem legendas.srt';
      const fronteira = `giz${randomBytes(8).toString('hex')}`;
      const corpo = Buffer.concat([
        Buffer.from(`--${fronteira}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ snippet: { videoId: id, language: 'pt-BR', name: 'Português' } })}\r\n--${fronteira}\r\ncontent-type: application/x-subrip\r\n\r\n`),
        readFileSync(srt), Buffer.from(`\r\n--${fronteira}--`),
      ]);
      await api(`${UPLOAD}/captions?part=snippet&uploadType=multipart`, { method: 'POST', headers: { 'content-type': `multipart/related; boundary=${fronteira}` }, body: corpo });
    }],
    ['capa', async () => {
      const c = capa(m.curso.capas, m.lesson.number);
      if (!c) return `sem capa "Aula ${m.lesson.number} - …" em ${m.curso.capas}`;
      if (statSync(c).size > 2 * 1024 * 1024) return 'capa maior que 2 MB';
      await api(`${UPLOAD}/thumbnails/set?videoId=${id}`, { method: 'POST', headers: { 'content-type': /\.png$/i.test(c) ? 'image/png' : 'image/jpeg' }, body: readFileSync(c) });
    }],
    ['playlist', async () => {
      const pl = await playlistDoCurso(m.curso.titulo);
      await api(`${API}/playlistItems?part=snippet`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ snippet: { playlistId: pl, resourceId: { kind: 'youtube#video', videoId: id } } }),
      });
    }],
  ];
  for (const [nome, passo] of passos) {
    try {
      const aviso = await passo();
      feito[nome] = aviso ?? 'ok';
      console.log(`  ${nome}: ${aviso ?? 'ok'}`);
    } catch (e) {
      if (e instanceof Cota) throw e;
      feito[nome] = `falhou: ${(e as Error).message.slice(0, 300)}`;
      console.log(`  ${nome}: ${feito[nome]}`);
    }
    writeFileSync(marca, JSON.stringify(feito, null, 2));
  }
}

// aula "pronta": tem vídeo e legendas, e o vídeo não muda há 2 minutos (não está sendo escrito)
function prontas(cursoDir: string): string[] {
  const aulas = join(resolve(cursoDir), 'aulas');
  return readdirSync(aulas).filter((d) => /^\d+-/.test(d)).sort().map((d) => join(aulas, d)).filter((d) => {
    const r = join(d, 'render');
    if (!existsSync(r)) return false;
    const mp4 = readdirSync(r).find((f) => /^aula-.*\.mp4$/.test(f) && !f.includes('celular'));
    return !!mp4 && existsSync(join(r, 'legendas.srt')) && Date.now() - statSync(join(r, mp4)).mtimeMs > 120_000;
  });
}

async function pendentes(cursoDir: string, privacidade: Privacidade, vigiar: boolean) {
  for (;;) {
    try {
      for (const d of prontas(cursoDir)) if (!existsSync(join(d, 'render', 'youtube.json'))) await publicar(d, privacidade);
    } catch (e) {
      if (!(e instanceof Cota)) throw e;
      console.log(`cota do YouTube esgotada; ${vigiar ? 'tento de novo em 1 h' : 'rode de novo amanhã'}.`);
      if (!vigiar) return;
      await new Promise((ok) => setTimeout(ok, 3600_000));
      continue;
    }
    if (!vigiar) return;
    await new Promise((ok) => setTimeout(ok, 300_000));
  }
}

function status(cursoDir: string) {
  for (const d of prontas(cursoDir)) {
    const marca = join(d, 'render', 'youtube.json');
    console.log(`${basename(d)}  ${existsSync(marca) ? JSON.parse(readFileSync(marca, 'utf8')).url : 'pendente'}`);
  }
}

const [cmd, alvo, ...resto] = process.argv.slice(2);
const flag = (n: string) => resto.includes(`--${n}`);
const opt = (n: string) => { const i = resto.indexOf(`--${n}`); return i >= 0 ? resto[i + 1] : undefined; };
const privacidade = (opt('privacidade') ?? 'private') as Privacidade;
if (!['private', 'unlisted', 'public'].includes(privacidade)) { console.error('--privacidade: private, unlisted ou public'); process.exit(2); }

if (cmd === 'login') await login();
else if (cmd === 'publicar' && alvo) await publicar(alvo, privacidade, flag('forcar'));
else if (cmd === 'pendentes' && alvo) await pendentes(alvo, privacidade, flag('vigiar'));
else if (cmd === 'status' && alvo) status(alvo);
else if (cmd === 'simular' && alvo) {
  const m = await metadados(resolve(alvo));
  console.log(`título: ${m.title}\ncapa: ${capa(m.curso.capas, m.lesson.number) ?? '(nenhuma)'}\nplaylist: ${m.curso.titulo}\n\n${m.description}`);
}
else { console.error('uso: npm run youtube -- login | publicar <aula> | pendentes <curso> [--vigiar] | status <curso> | simular <aula>   [--privacidade private|unlisted|public]'); process.exit(2); }
