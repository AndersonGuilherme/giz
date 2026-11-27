// The S4 part of the smoke test: the Cast editor (a parameter changed with its drawn options, a sample heard in the
// live preview, a new character), the Scenarios grid (an uploaded picture with the shape warning, an image made by
// the rehearsal painter, "usar a gerada") and the Voices list (all pending, one again, a take recorded with Chromium's
// fake microphone), all in rehearsal mode: no network, no key, no voice model.
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import assert from 'node:assert/strict';
import type { Page } from './devtools.ts';
import type { Context } from './scriptSteps.ts';

const jsonOf = async (folder: string, file: string) => JSON.parse(await readFile(join(folder, file), 'utf8'));
const call = async <T>(page: Page, expression: string): Promise<T> => {
  const answer = (await page.evaluate(expression)) as { ok: boolean; value: T; failure?: unknown };
  assert.equal(answer.ok, true, JSON.stringify(answer.failure));
  return answer.value;
};
const until = async (check: () => Promise<boolean>, what: string, deadline = Date.now() + 60_000): Promise<void> => {
  if (await check()) return;
  if (Date.now() > deadline) throw new Error(`timed out waiting for: ${what}`);
  await new Promise((done) => setTimeout(done, 200));
  return until(check, what, deadline);
};

async function replace(page: Page, selector: string, text: string): Promise<void> {
  await page.until(selector);
  await page.evaluate(`(() => { const box = document.querySelector(${JSON.stringify(selector)}); box.focus(); box.select(); })()`);
  await page.send('Input.insertText', { text });
}

// A real square PNG (800×800, one color): another shape than a 9:16 video.
function squarePng(): Buffer {
  const crcTable = Array.from({ length: 256 }, (_unused, start) => [...Array(8)].reduce((value: number) => (value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1), start) >>> 0);
  const crc = (bytes: Buffer) => (bytes.reduce((value, byte) => crcTable[(value ^ byte) & 0xff]! ^ (value >>> 8), 0xffffffff) ^ 0xffffffff) >>> 0;
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(800, 0);
  header.writeUInt32BE(800, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(800 * 3, 0x9c)]);
  const pixels = deflateSync(Buffer.concat(Array.from({ length: 800 }, () => row)));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', pixels), chunk('IEND', Buffer.alloc(0))]);
}

const scene = (background: object) => ({ type: 'scenario', background, characters: [{ character: 'bia', position: 'left' }, { character: 'caio', position: 'right' }] });

/** A story with Bia and Caio, made through the bridge, with three scenario scenes; it opens on its Cast stage. */
export async function storyProject({ page }: Context): Promise<string> {
  const idea = { format: 'story', aspect: '9:16', targetSeconds: 30, theme: 'Um gato detetive na cidade', audience: 'crianças', tone: 'leve', language: 'pt-BR', cast: ['bia', 'caio'], scenes: ['street'] };
  const folder = await call<string>(page, `window.giz.projects.create(${JSON.stringify(idea)})`);
  const script = await jsonOf(folder, 'script.json');
  const line = (id: string, said: readonly [string, string], extra: object = {}) => ({ id, chapter: 1, speaker: said[0], text: said[1], ...extra });
  script.lines = [
    line('1', ['bia', 'Caio, o gato sumiu de novo!'], { scene: scene({ vector: 'street' }) }),
    line('2', ['caio', 'Calma, eu sei onde procurar.'], { scene: scene({ vector: 'room', generate: { prompt: 'um sótão cheio de caixas, luz de fim de tarde' } }) }),
    line('3', ['bia', 'Lá em cima? Que medo.']),
    line('4', ['caio', 'Vamos para o laboratório.'], { scene: scene({ vector: 'lab' }) }),
  ];
  await writeFile(join(folder, 'script.json'), JSON.stringify(script, null, 2));
  await page.click('[data-testid="go-home"]');
  await page.click(`[data-testid="project-${basename(folder)}"] [data-testid="project-open"]`);
  await page.click('[data-testid="tab-cast"]');
  return folder;
}

/** The Cast stage: an outfit picked by its drawing, glasses on, a sample heard, a pose tried, a new character, a refusal. */
export async function castStage({ page, shoot }: Context, folder: string): Promise<void> {
  await page.until('[data-testid="cast-screen"] [data-testid="member-bia"]');
  await page.until('[data-testid="live-preview"] .player-frame svg');
  await shoot(page, 's4-01-elenco');
  const face = await page.evaluate(`document.querySelector('[data-testid="member-bia"] svg').outerHTML`);
  await page.click('[data-testid="param-outfit"] .option-current');
  await page.until('[data-testid="param-outfit"] .option-choice[data-value="lab-coat"] svg');
  await page.evaluate(`document.querySelector('[data-testid="param-outfit"]').scrollIntoView({ block: 'center' })`);
  await shoot(page, 's4-02-roupas');
  await page.evaluate('window.scrollTo(0, 0)');
  await page.click('[data-testid="param-outfit"] .option-choice[data-value="lab-coat"]');
  await page.click('[data-testid="param-glasses"]');
  await page.until('[data-testid="character-save"][data-state="saved"]');
  await until(async () => (await jsonOf(folder, 'cast/bia.json')).parameters.glasses === true, 'cast/bia.json saved');
  await until(async () => (await page.evaluate(`document.querySelector('[data-testid="member-bia"] svg').outerHTML`)) !== face, 'the list shows the saved look');
  assert.equal((await jsonOf(folder, 'cast/bia.json')).parameters.glasses, true);
  await page.click('[data-testid="voice-sample"]');
  await page.untilText('[data-testid="voice-sample"]', /Ouvir amostra/);
  await page.click('[data-testid="preview-poses"] [data-value="celebrate"]');
  await shoot(page, 's4-03-amostra-e-pose');
  const bia = await jsonOf(folder, 'cast/bia.json');
  const refused = await call<{ saved: boolean; problems: Array<{ path: string }> }>(page, `window.giz.cast.save(${JSON.stringify(folder)}, ${JSON.stringify({ ...bia, parameters: { skin: 'roxo' } })})`);
  assert.deepEqual([refused.saved, refused.problems[0]?.path], [false, 'parameters.skin'], 'core refuses an invalid parameter; nothing is written');
  assert.equal((await jsonOf(folder, 'cast/bia.json')).parameters.outfit, 'lab-coat');
  await headwearGrid(page, shoot);
  await page.click('[data-testid="cast-add"]');
  await page.until('[data-testid="cast-presets"] li svg');
  await shoot(page, 's4-04-adicionar');
  await tallHatsWhole(page, shoot);
  await page.type('[data-testid="new-character-name"]', 'Prof. Rui');
  await page.click('[data-testid="new-character"]');
  await page.until('[data-testid="member-prof-rui"].on');
  assert.ok((await jsonOf(folder, 'project.json')).cast.includes('prof-rui'));
  await page.click('[data-testid="member-narrator"]');
  await page.untilText('[data-testid="live-preview"]', /só voz/);
  await lastEditKept(page, folder);
}

// The headwear options are framed from above their top: a chef hat is drawn whole (s4fix).
async function headwearGrid(page: Page, shoot: Context['shoot']): Promise<void> {
  await page.click('[data-testid="param-headwear"] .option-current');
  await page.until('[data-testid="param-headwear"] .option-choice[data-value="chef-hat"] svg');
  await page.evaluate(`document.querySelector('[data-testid="param-headwear"] .option-choice[data-value="chef-hat"]').scrollIntoView({ block: 'center' })`);
  await shoot(page, 's4fix-02-chapeus');
  await page.click('[data-testid="param-headwear"] .option-current');
  await page.evaluate('window.scrollTo(0, 0)');
}

// The ready characters with tall headwear (chef hat, knight's plume, viking horns, pirate hat): each face starts above
// the rig's view box top, so nothing is cut (s4fix).
async function tallHatsWhole(page: Page, shoot: Context['shoot']): Promise<void> {
  for (const preset of ['nono', 'bento', 'sigrid', 'marina']) {
    const top = Number(await page.evaluate(`document.querySelector('[data-testid="preset-${preset}"] svg').getAttribute('viewBox').split(' ')[1]`));
    assert.ok(top < -30, `the ${preset} face is framed from above its headwear (viewBox top ${top})`);
  }
  await page.evaluate(`document.querySelector('[data-testid="preset-nono"]').scrollIntoView({ block: 'center' })`);
  await shoot(page, 's4fix-01-presets-chapeus');
}

// A change still waiting for its autosave is not lost when the person goes to another stage right away.
async function lastEditKept(page: Page, folder: string): Promise<void> {
  await page.click('[data-testid="member-bia"]');
  await replace(page, '[data-testid="character-name"]', 'Bia Detetive');
  await page.click('[data-testid="tab-scenarios"]');
  await until(async () => (await jsonOf(folder, 'cast/bia.json')).name === 'Bia Detetive', 'the pending character change saved on leaving');
}

async function setFile(page: Page, selector: string, path: string): Promise<void> {
  const { root } = (await page.send('DOM.getDocument')) as { root: { nodeId: number } };
  const { nodeId } = (await page.send('DOM.querySelector', { nodeId: root.nodeId, selector })) as { nodeId: number };
  await page.send('DOM.setFileInputFiles', { nodeId, files: [path] });
}

/** The Scenarios stage: an upload (the shape warning), an image made by the rehearsal painter, "usar a gerada". */
export async function scenariosStage({ page, shoot, home }: Context, folder: string): Promise<void> {
  await page.click('[data-testid="tab-scenarios"]');
  await page.until('[data-testid="scene-1"] .scene-thumb svg');
  await page.until('[data-testid="scene-state-2"][data-state="missing"]');
  await shoot(page, 's4-05-cenarios');
  const picture = join(home, 'quadrada.png');
  await writeFile(picture, squarePng());
  await setFile(page, '[data-testid="scene-file-1"]', picture);
  await page.untilText('[data-testid="scene-warning-1"]', /800×800, outra proporção/);
  assert.equal((await jsonOf(folder, 'script.json')).lines[0].scene.background.image, 'scenes/own/1.png');
  await page.click('[data-testid="scene-generate-2"]');
  await replace(page, '[data-testid="image-prompt"]', 'um sótão cheio de caixas antigas, luz quente de fim de tarde');
  await page.click('[data-testid="image-price"]');
  await page.untilText('[data-testid="image-estimate"]', /fal\.ai \(Flux\) · fal-ai\/flux-2-pro[\s\S]*US\$/);
  await shoot(page, 's4-06-custo');
  await page.click('[data-testid="image-confirm"]');
  await page.untilText('[data-testid="image-running"]', /pintando/);
  await shoot(page, 's4-07-gerando');
  await page.until('[data-testid="scene-state-2"][data-state="done"]');
  assert.equal((await jsonOf(folder, 'project.json')).imageProvider, 'fal', 'the project keeps the image AI it was made with');
  assert.equal((await jsonOf(folder, 'script.json')).lines[1].scene.background.image, 'scenes/2.png');
  await shoot(page, 's4-08-gerado');
  await setFile(page, '[data-testid="scene-file-2"]', picture);
  await page.click('[data-testid="scene-use-generated-2"]');
  await until(async () => (await jsonOf(folder, 'script.json')).lines[1].scene.background.image === 'scenes/2.png', 'usar a gerada');
}

// Leaving the stage while every voice is being made, and coming back: the job still runs in main, so the screen shows
// it busy (no second "Gerar todas"), then reloads by itself when it ends (s4fix).
async function busyAfterComingBack(page: Page, shoot: Context['shoot']): Promise<void> {
  await page.click('[data-testid="voices-generate-all"]');
  await page.until('[data-testid="voices-progress"]');
  await page.click('[data-testid="tab-script"]');
  await page.click('[data-testid="tab-voices"]');
  await page.until('[data-testid="voices-screen"]');
  const shown = String(await page.evaluate(`(() => { const all = document.querySelector('[data-testid="voices-generate-all"]'); return [all.disabled, !!document.querySelector('[data-testid="voices-cancel"]')].join(); })()`));
  const done = await page.evaluate(`document.querySelector('[data-testid="voice-4"]').dataset.state === 'done'`);
  if (!done) assert.equal(shown, 'true,true', 'back on the stage mid-job: "Gerar todas" busy and cancellable');
  console.log(done ? 'smoke: the voice job ended before the stage was back (busy check skipped)' : 'smoke: back on Vozes mid-job: "Gerar todas" disabled, cancel shown');
  await page.until('[data-testid="voice-4"][data-state="done"]');
  await page.until('[data-testid="voices-generate-all"]:disabled');
  await page.until('[data-testid="voices-pending"]:not(:has([data-testid="voices-cancel"]))');
  await shoot(page, 's4fix-03-vozes');
}

// Leaving the stage mid-take closes the microphone and keeps nothing of the take (s4fix).
async function micClosedOnLeaving(page: Page, folder: string): Promise<void> {
  await page.evaluate(`(() => { window.__streams = []; const ask = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices); navigator.mediaDevices.getUserMedia = async (wanted) => { const stream = await ask(wanted); window.__streams.push(stream); return stream; }; })()`);
  await page.click('[data-testid="voice-record-2"]');
  await page.until('[data-testid="recording-2"]');
  await page.click('[data-testid="tab-cast"]');
  await page.until('[data-testid="cast-screen"]');
  const closed = await page.evaluate(`window.__streams.length === 1 && window.__streams[0].getTracks().every((track) => track.readyState === 'ended')`);
  assert.equal(closed, true, 'the microphone track ended when the Voices stage went away');
  await readFile(join(folder, 'recordings', '2.wav')).then(() => assert.fail('a dropped take is never saved'), () => undefined);
}

/** The Voices stage: every pending line, one line again, then a take recorded with the (fake) microphone. */
export async function voicesStage({ page, shoot }: Context, folder: string): Promise<void> {
  await page.click('[data-testid="tab-voices"]');
  await page.until('[data-testid="voice-1"][data-state="missing"]');
  await shoot(page, 's4-09-vozes');
  await busyAfterComingBack(page, shoot);
  await page.until('[data-testid="voice-audio-1"]');
  const seconds = await page.evaluate(`new Promise((done) => { const audio = document.querySelector('[data-testid="voice-audio-2"]'); audio.addEventListener('loadedmetadata', () => done(audio.duration), { once: true }); audio.preload = 'metadata'; audio.load(); })`);
  assert.ok(Number(seconds) > 0.5, `the line's audio plays through the media scheme (${seconds} s)`);
  await page.click('[data-testid="voice-regenerate-3"]');
  await page.until('[data-testid="voice-regenerate-3"]:not(:disabled)');
  await page.click('[data-testid="voice-record-1"]');
  await page.until('[data-testid="recording-1"]');
  await new Promise((done) => setTimeout(done, 1500));
  await shoot(page, 's4-10-gravando');
  await page.click('[data-testid="voice-stop-1"]');
  await page.until('[data-testid="voice-own-1"]');
  await page.until('[data-testid="voice-1"][data-state="done"]');
  const take = await readFile(join(folder, 'recordings', '1.wav'));
  assert.deepEqual([take.toString('latin1', 0, 4), take.readUInt16LE(22), take.readUInt16LE(34)], ['RIFF', 1, 16], 'a 16-bit mono WAV');
  assert.ok(take.length > 20_000, 'about a second and a half of audio');
  await shoot(page, 's4-11-gravado');
  await micClosedOnLeaving(page, folder);
}
