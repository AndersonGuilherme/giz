import { resolve } from 'node:path';
import { UsageError } from '../usage.ts';

// `gizzy models`, `gizzy gpu` and `gizzy sounds`: install and maintenance tools (the composition parts load on demand).
const tools = () => import('../composition/tools.ts');
const install = () => import('../composition/install.ts');

/** `gizzy models [--whisper]`: downloads the voice model of gizzycera.config.json now (generating a voice also does it). */
export async function modelsCommand(args: readonly string[]): Promise<void> {
  const { downloadVoiceModel, downloadWhisper } = await tools();
  console.log(`voz pronta em ${await downloadVoiceModel((await install()).installConfig(), console.log)}`);
  if (!args.includes('--whisper')) return;
  await downloadWhisper();
  console.log('Whisper pronto');
}

/** `gizzy gpu info | install`: what the GPU setup sees, or installs the CUDA provider and the NVIDIA libraries. */
export async function gpuCommand([action]: readonly string[]): Promise<void> {
  const { gpu } = await tools();
  if (action === 'info') return console.log(gpu.info());
  if (action !== 'install') throw new UsageError('uso: gizzy gpu info | install');
  await gpu.install((await install()).installConfig().modelsDir, console.log);
  console.log('GPU pronta para a voz.');
}

/** `gizzy sounds [pasta]`: synthesizes the sound effects (by default into the package public/sounds/). */
export async function soundsCommand([folder]: readonly string[]): Promise<void> {
  const { SOUNDS_FOLDER, synthesizeSounds } = await tools();
  const target = folder ? resolve(folder) : SOUNDS_FOLDER;
  console.log(`ok: ${(await synthesizeSounds(target)).join(', ')} → ${target}`);
}
