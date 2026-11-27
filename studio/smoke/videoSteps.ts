// The S5 part of the smoke test: the Video stage on a copy of core's coupon lesson. One line has no voice, so the
// montage says so and leads to the Voices stage; then the whole video plays in the Player (seek, chapter and line
// jumps); in 9:16 the check finds the long title and jumps to its line in the script; a render is cancelled, then a
// short real one (rehearsal mode renders the first second) is watched, its folder opened and its captions copied
// and exported (the rehearsal desktop logs those instead of opening anything).
import { cp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import type { Page } from './devtools.ts';
import type { Context } from './scriptSteps.ts';

const SLUG = 'cupom-em-video';
// Fits 16:9, not 9:16: the check in 9:16 reports it on line 003 (the title scene).
const LONG_TITLE = 'O cupom que deixava tudo muito mais caro para todos os clientes';

const text = (page: Page, selector: string) => page.evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? ''`) as Promise<string>;
const until = async (check: () => Promise<boolean>, what: string, deadline = Date.now() + 120_000): Promise<void> => {
  if (await check()) return;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await new Promise((done) => setTimeout(done, 200));
  return until(check, what, deadline);
};
const desktopLog = async (home: string) => (await readFile(join(home, 'desktop.log'), 'utf8').catch(() => '')).trim().split('\n').filter(Boolean).map((line) => JSON.parse(line) as Record<string, string>);

/** A copy of the coupon lesson in the projects folder, without its output, line 010's voice nor the short title. */
async function couponCopy(home: string, coupon: string): Promise<string> {
  const folder = join(home, 'giz', 'projetos', SLUG);
  await cp(coupon, folder, { recursive: true, filter: (source) => !source.includes(`${coupon}/output`) });
  await Promise.all(['010.wav', '010.json'].map((file) => rm(join(folder, 'voice', file), { force: true })));
  const script = JSON.parse(await readFile(join(folder, 'script.json'), 'utf8'));
  script.lines.find((line: { id: string }) => line.id === '003').scene.title = LONG_TITLE;
  await writeFile(join(folder, 'script.json'), JSON.stringify(script, null, 2));
  return folder;
}

async function openVideoStage(page: Page): Promise<void> {
  await page.click('[data-testid="go-home"]');
  await page.click(`[data-testid="project-${SLUG}"] [data-testid="project-open"]`);
  await page.until('[data-testid="check-report"]');
  await page.click('[data-testid="tab-video"]');
  await page.until('[data-testid="video-screen"][data-loading="false"]');
}

/** A missing voice: no montage, the reason by line number, and the button to Voices that makes it. */
async function missingVoice({ page, shoot }: Context): Promise<void> {
  await page.untilText('[data-testid="montage-failure"]', /Falta a voz de 1 fala: 10/);
  await page.untilText('[data-testid="video-missing"]', /Sem voz: 1 fala \(10\)/);
  await shoot(page, 's5-01-falta-voz');
  await page.click('[data-testid="montage-voices"]');
  await page.until('[data-testid="voices-screen"]');
  await page.click('[data-testid="voices-generate-all"]');
  await page.untilText('[data-testid="voices-pending"]', /Todas as falas estão em dia/);
  await page.click('[data-testid="tab-video"]');
  await page.until('[data-testid="video-preview"]');
  await page.untilText('[data-testid="video-missing"]', /Nada falta/);
}

// Moves the slider as a person drags it (the native setter, so React sees an input event).
async function seekTo(page: Page, frame: number): Promise<void> {
  await page.evaluate(`(() => {
    const seek = document.querySelector('[data-testid="video-seek"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(seek, '${frame}');
    seek.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await until(async () => (await frameOf(page)) === frame, `the seek to frame ${frame}`);
}

const frameOf = async (page: Page) => Number(await page.evaluate(`document.querySelector('[data-testid="video-seek"]').value`));

/** The Player draws the video; the slider seeks; a chapter and a line jump there; play moves the clock. */
async function playAndSeek({ page, shoot }: Context): Promise<void> {
  await until(async () => Boolean(await page.evaluate(`document.querySelector('.video-frame svg, .video-frame canvas, .video-frame img') !== null`)), 'the Player drawing the video');
  await seekTo(page, 60);
  await page.untilText('.video-frame', /Reclamação #4521/);
  await shoot(page, 's5-02-previa');
  await seekTo(page, 600);
  await page.untilText('[data-testid="video-clock"]', /^0:20 \//);
  await page.click('[data-testid="video-chapters"] button:last-child');
  const chapterFrame = await frameOf(page);
  assert.ok(chapterFrame > 600, `the last chapter starts later (${chapterFrame})`);
  await page.click('[data-testid="video-lines"] [data-line="004"]');
  await until(async () => (await page.evaluate(`document.querySelector('.video-frame').dataset.currentLine`)) === '004', 'line 004 marked as playing');
  await seekTo(page, (await frameOf(page)) + 45);
  await shoot(page, 's5-03-fala-004');
  await page.click('[data-testid="video-play"]');
  const before = await frameOf(page);
  await until(async () => (await frameOf(page)) > before + 15, 'the video playing');
  await page.click('[data-testid="video-play"]');
}

/** In 9:16 the long title does not fit: the check says so on line 3, and the jump selects it in the script. */
async function otherAspect({ page, shoot }: Context): Promise<void> {
  await page.click('[data-testid="video-aspect"] button[data-value="9:16"]');
  await page.untilText('[data-testid="video-check"]', /Verificação em 9:16[\s\S]*título não cabe/);
  await page.until('.video-frame.tall');
  await page.until('[data-testid="render-blocked"]');
  await shoot(page, 's5-04-9x16-com-erro');
  await page.click('[data-testid="video-check"] [data-testid="video-jump"][data-line="003"]');
  await page.until('[data-testid="line-2"].selected');
  await shoot(page, 's5-05-fala-no-roteiro');
  await page.click('[data-testid="tab-video"]');
  await page.untilText('[data-testid="video-check"]', /Verificação em 16:9[\s\S]*Tudo certo/);
}

/** A render cancelled while it prepares, then a short real one, watched, with its folder and captions. */
async function render({ page, shoot, home }: Context, folder: string): Promise<void> {
  await page.click('[data-testid="video-render"] .render-actions .primary');
  await page.untilText('[data-testid="video-render"] .status', /Preparando|Renderizando/);
  await page.click('[data-testid="video-render"] .render-actions button:not(.primary)');
  await page.untilText('[data-testid="video-render"] .status', /Render cancelado/);
  await page.click('[data-testid="video-render"] .render-actions .primary');
  await page.untilText('[data-testid="video-render"] .status', /Renderizando… [1-9]/);
  await shoot(page, 's5-06-renderizando');
  await page.untilText('[data-testid="video-render"] .status', /Vídeo pronto/);
  await page.untilText('[data-testid="render-history"]', /16:9/);
  assert.ok((await stat(join(folder, 'output', 'video.mp4'))).size > 1000);
  assert.match(await readFile(join(folder, 'output', 'captions.srt'), 'utf8'), /-->/);
  await shoot(page, 's5-07-pronto');
  await page.click('[data-testid="video-watch"]');
  await until(async () => Number(await page.evaluate(`document.querySelector('[data-testid="watch-video"]')?.duration || 0`)) > 0.5, 'the rendered video loaded in the window');
  await shoot(page, 's5-08-assistir');
  await page.click('[data-testid="watch-close"]');
  await outputs({ page, shoot, home }, folder);
}

async function outputs({ page, shoot, home }: Context, folder: string): Promise<void> {
  await page.click('[data-testid="video-open-folder"]');
  await page.untilText('[data-testid="video-note"]', /pasta do vídeo foi aberta/);
  await page.click('[data-testid="video-copy-captions"]');
  await page.untilText('[data-testid="video-note"]', /legenda \(SRT\) foi copiada/);
  await page.click('[data-testid="video-export-captions"]');
  await page.untilText('[data-testid="video-note"]', /Legenda salva em/);
  const log = await desktopLog(home);
  assert.equal(log[0]?.open, join(folder, 'output'));
  assert.match(log[1]?.copied ?? '', /-->/);
  assert.ok((await stat(join(home, 'exported', `${SLUG}.srt`))).size > 10);
  const unsafe = (await page.evaluate(`window.giz.video.copyCaptions(${JSON.stringify(folder)}, '4:3')`)) as { failure: { code: string } };
  assert.equal(unsafe.failure.code, 'invalid-request');
  const ungranted = (await page.evaluate(`window.giz.video.preview('/etc')`)) as { failure: { code: string } };
  assert.equal(ungranted.failure.code, 'invalid-request');
  await shoot(page, 's5-09-legenda-exportada');
}

/** The Video stage, from a missing voice to a rendered, watched video with its captions. */
export async function videoStage(context: Context, coupon: string): Promise<void> {
  const folder = await couponCopy(context.home, coupon);
  await openVideoStage(context.page);
  await missingVoice(context);
  await playAndSeek(context);
  await otherAspect(context);
  await render(context, folder);
  assert.equal(await text(context.page, '[data-testid="video-check-summary"]'), 'Tudo certo: nenhum erro, nenhum aviso.');
  await context.page.click('[data-testid="tab-script"]');
  await context.page.until('[data-testid="check-report"]');
}

