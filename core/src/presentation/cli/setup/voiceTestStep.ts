import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GizConfig } from '../composition/install.ts';
import type { LocalVoice } from '../composition/tools.ts';
import type { SetupContext } from './setupContext.ts';
import { TOTAL_STEPS } from './setupContext.ts';
import { green, step, yellow } from './prompts.ts';
import { VOICES } from './voiceCatalog.ts';

// Step 7 of `giz setup`: downloads the voice model and tests it ON THIS machine (GPU falls back to CPU), with samples.
type Save = (config: GizConfig) => void;
type Test = Readonly<{ voice: LocalVoice; samples: Float32Array; seconds: number }>;

const tools = () => import('../composition/tools.ts');
const REPOSITORY = fileURLToPath(new URL('../../../../../', import.meta.url));
/** voice-samples/ at the repository root (gitignored). */
export const SAMPLES_FOLDER = join(REPOSITORY, 'voice-samples');

async function testLine(config: GizConfig): Promise<Test> {
  const voice = await (await tools()).openLocalVoice(config);
  const started = performance.now();
  const samples = await voice.generate('Olá! Eu sou a Lia, e este é o Téo.', { speaker: config.voices.lia, language: config.language, instruct: config.styles.lia || undefined, seed: 7 });
  return { voice, samples, seconds: (performance.now() - started) / 1000 };
}

async function onCpu(context: SetupContext, error: unknown, save: Save): Promise<Test> {
  if (context.config.device !== 'cuda') throw error;
  console.log(yellow(`⚠ a GPU falhou no teste (${(error as Error).message.split('\n')[0]}). Voltando para CPU.`));
  context.config.device = 'cpu';
  save(context.config);
  return testLine(context.config);
}

async function testWithFallback(context: SetupContext, save: Save): Promise<Test> {
  try {
    return await testLine(context.config);
  } catch (error) {
    return onCpu(context, error, save);
  }
}

async function allSamples({ prompter, config }: SetupContext, voice: LocalVoice): Promise<void> {
  if (!(await prompter.yes('Gerar amostras de TODAS as vozes para você ouvir e comparar? (~1 min por voz em CPU)', false))) return;
  const { wavOf } = await tools();
  for (const sample of VOICES) {
    const style = sample.gender === 'f' ? config.styles.lia : config.styles.teo;
    const audio = await voice.generate('Então como uma consulta de frete disparou três mil e-mails?', { speaker: sample.value, language: config.language, instruct: style || undefined, seed: 7 });
    writeFileSync(join(SAMPLES_FOLDER, `${sample.value}.wav`), wavOf(audio));
    console.log(`  ${sample.value}.wav`);
  }
}

export async function downloadAndTest(context: SetupContext, save: Save): Promise<void> {
  step(7, TOTAL_STEPS, 'Baixando o modelo de voz e testando');
  if (context.dryRun) return console.log('(simulação: o modelo não foi baixado nem testado)');
  const { downloadVoiceModel, downloadWhisper, secondsOf, wavOf } = await tools();
  await downloadVoiceModel(context.config, console.log);
  const test = await testWithFallback(context, save);
  mkdirSync(SAMPLES_FOLDER, { recursive: true });
  writeFileSync(join(SAMPLES_FOLDER, `lia-${context.config.voices.lia}.wav`), wavOf(test.samples));
  const place = context.config.device === 'cuda' ? 'GPU' : 'CPU';
  console.log(green(`✔ voz funcionando em ${place}: ${(test.seconds / secondsOf(test.samples)).toFixed(1)} s para gerar cada 1 s de fala`));
  await allSamples(context, test.voice);
  if (!context.config.qa) return;
  console.log('Baixando o Whisper...');
  await downloadWhisper();
  console.log(green('✔ Whisper pronto'));
}
