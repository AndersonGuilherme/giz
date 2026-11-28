// The GPU on the packaged app, for real (an NVIDIA machine with network; not part of CI): in an isolated home, the
// GPU setup downloads the ONNX Runtime CUDA provider into the writable copy in userData (the app's folder may be
// read-only, as a deb or an AppImage installs it), then one line of the example is voiced by the local voice (Qwen 0.6B)
// and the voice worker must have loaded ONNX Runtime from that copy, on the GPU.
// Run: node smoke/packagedGpu.ts <program>   (GIZ_GPU_MODELS: a models folder that already has Qwen 0.6B; default ~/.cache/giz)
import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { devtools, poll } from './devtools.ts';

const [program] = process.argv.slice(2);
if (!program) throw new Error('usage: node smoke/packagedGpu.ts <packaged program>');
const EXAMPLE = fileURLToPath(new URL('../../core/examples/coupon-lesson/pt-BR', import.meta.url));
const PORT = 9600 + Math.floor(Math.random() * 300);
const home = await mkdtemp(join(tmpdir(), 'giz-gpu-home-'));
const folder = join(home, 'cupom');
await cp(EXAMPLE, folder, { recursive: true });
const project = JSON.parse(await readFile(join(folder, 'project.json'), 'utf8'));
await writeFile(join(folder, 'project.json'), JSON.stringify({ ...project, voice: { provider: 'qwen', model: '0.6b' } }));
await writeFile(join(home, 'giz.config.json'), JSON.stringify({ modelsDir: process.env.GIZ_GPU_MODELS ?? join(homedir(), '.cache', 'giz'), model: '0.6b', device: 'cpu' }));

const app = spawn(program, [`--remote-debugging-port=${PORT}`, `--project=${folder}`, '--ozone-platform=headless'], { env: { ...process.env, GIZ_STUDIO_HOME: home }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
let output = '';
app.stdout.on('data', (chunk) => (output += chunk));
app.stderr.on('data', (chunk) => (output += chunk));

type Target = { type: string; webSocketDebuggerUrl: string };
const pageTarget = async () => ((await fetch(`http://127.0.0.1:${PORT}/json/list`).then((answer) => answer.json()).catch(() => [])) as Target[]).find((target) => target.type === 'page');

try {
  const page = devtools((await poll(pageTarget, 'the window')).webSocketDebuggerUrl);
  const setup = (await page.evaluate(`window.giz.setup.run('gpu')`)) as { ok: boolean };
  assert.equal(setup.ok, true, JSON.stringify(setup));
  assert.equal(JSON.parse(await readFile(join(home, 'giz.config.json'), 'utf8')).device, 'cuda', 'the GPU setup chose the GPU');
  const copy = join(home, 'userData', 'onnxruntime');
  const [version] = await readdir(copy);
  const files = await readdir(join(copy, version, `${process.platform}-${process.arch}`));
  assert.ok(files.includes('libonnxruntime_providers_cuda.so') && files.includes('onnxruntime_binding.node'), files.join(', '));
  const started = Date.now();
  const voiced = (await page.evaluate(`window.giz.voices.generate(${JSON.stringify(folder)}, '001')`)) as { ok: boolean };
  assert.equal(voiced.ok, true, JSON.stringify(voiced).slice(0, 600));
  assert.match(output, /giz voices: ONNX Runtime from the writable copy \(GPU\)/);
  assert.doesNotMatch(output, /GPU não configurada/);
  console.log(`packaged GPU: provider in ${copy}; one line voiced on the GPU in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  page.close();
} catch (error) {
  console.error(output.slice(-3000));
  throw error;
} finally {
  process.kill(-(app.pid ?? 0), 'SIGTERM');
}
