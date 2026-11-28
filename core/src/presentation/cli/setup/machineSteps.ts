import { mkdirSync, statfsSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import type { SetupContext } from './setupContext.ts';
import { TOTAL_STEPS } from './setupContext.ts';
import { green, step, yellow } from './prompts.ts';

// Steps 1–3 of `gizzy setup`: Node, the models folder and the hardware (CPU or NVIDIA GPU).
const tools = () => import('../composition/tools.ts');

function freeGigabytes(folder: string): number {
  try {
    const stats = statfsSync(folder);
    return (stats.bavail * stats.bsize) / 1e9;
  } catch {
    return NaN;
  }
}

// NaN: the folder does not exist yet (a dry run does not create it) or cannot be read.
function freeSpaceLine(free: number): string {
  if (Number.isNaN(free)) return yellow('⚠ espaço livre desconhecido (a pasta ainda não existe)');
  return free < 10 ? yellow(`⚠ só ${free.toFixed(0)} GB livres nessa pasta (recomendado: 10 GB)`) : green(`✔ ${free.toFixed(0)} GB livres`);
}

export function checkNode(): void {
  step(1, TOTAL_STEPS, 'Verificando o Node.js');
  const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 18)) throw new Error(`Node ${process.versions.node} é antigo. Instale o Node 22.18+ (https://nodejs.org) e rode de novo.`);
  console.log(green(`✔ Node ${process.versions.node}`));
}

export async function modelsFolder(context: SetupContext): Promise<void> {
  step(2, TOTAL_STEPS, 'Onde guardar os modelos de IA');
  console.log('A voz usa o modelo aberto Qwen3-TTS (5,9 GB ou 13,4 GB, você escolhe no passo 4), baixado uma única vez. Com GPU, mais ~1,8 GB de bibliotecas CUDA.');
  context.config.modelsDir = await context.prompter.ask('Pasta dos modelos', context.previous.modelsDir);
  if (!context.dryRun) mkdirSync(context.config.modelsDir, { recursive: true });
  console.log(freeSpaceLine(freeGigabytes(context.config.modelsDir)));
}

async function installGpu(context: SetupContext): Promise<void> {
  if (context.dryRun) return console.log('(simulação: as bibliotecas CUDA não foram baixadas)');
  const { gpu } = await tools();
  await gpu.install(context.config.modelsDir, console.log);
  console.log(green('✔ bibliotecas CUDA instaladas (o teste real é no passo 7)'));
}

async function offerGpu(context: SetupContext): Promise<void> {
  const found = context.gpu;
  if (!found) return console.log('Nenhuma GPU NVIDIA detectada (ou o driver não está instalado). A voz vai rodar na CPU: funciona, só é mais lenta.');
  console.log(green(`✔ GPU NVIDIA encontrada: ${found.name} (${(found.memoryMiB / 1024).toFixed(0)} GB, driver ${found.driver})`));
  if (!(await context.prompter.yes('Usar a GPU para gerar as vozes? Bem mais rápido; baixa ~1,8 GB de bibliotecas da NVIDIA (sem sudo)', true))) return;
  try {
    await installGpu(context);
    context.config.device = 'cuda';
  } catch (error) {
    console.log(yellow(`⚠ não consegui preparar a GPU: ${(error as Error).message}\n  Seguindo com CPU. Você pode tentar de novo depois com npx gizzy setup.`));
  }
}

export async function hardware(context: SetupContext): Promise<void> {
  step(3, TOTAL_STEPS, 'Hardware: CPU ou GPU');
  const memory = totalmem() / 1e9;
  console.log(`CPU: ${cpus().length} núcleos · RAM: ${memory.toFixed(0)} GB${memory < 12 ? yellow('  (a voz usa ~7 GB de RAM: feche outros programas ao gerar)') : ''}`);
  context.gpu = (await tools()).gpu.detect();
  context.config.device = 'cpu';
  await offerGpu(context);
  if (context.config.device !== 'cpu') return;
  const threads = await context.prompter.ask('Quantos núcleos da CPU usar para a voz? (0 = todos)', String(context.previous.threads));
  context.config.threads = Math.max(0, Number(threads) || 0);
}
