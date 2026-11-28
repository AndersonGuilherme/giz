import type { GizzyConfig } from '../composition/install.ts';
import { hardware, checkNode, modelsFolder } from './machineSteps.ts';
import { pronunciationCheck, remotionLicense, voiceChoices } from './choiceSteps.ts';
import { bold, green, Prompter } from './prompts.ts';
import type { SetupContext } from './setupContext.ts';
import { downloadAndTest } from './voiceTestStep.ts';

// The guided onboarding of Gizzycera (`gizzy setup`, the motor's `npm run setup`): asks what is needed, downloads what is
// missing and tests everything ON THIS machine. The answers go to gizzycera.config.json (individual, out of git).
export const SETUP_USAGE = `uso: gizzy setup [--defaults] [--dry-run]
  --defaults   aceita todas as respostas padrão, sem perguntar (o mesmo que rodar sem terminal; --padrao também vale)
  --dry-run    mostra as perguntas e a configuração que resultaria, sem gravar, baixar nem instalar nada`;

const INTRO = `
${bold('✏️  Gizzycera — configuração desta instalação')}

Vou fazer algumas perguntas e preparar tudo para você gerar vídeos ${bold('neste computador')}.
A voz local não usa conta, chave de API nem serviço pago. As respostas ficam em ${bold('gizzycera.config.json')}
(só seu, fora do git). Pode rodar ${bold('npx gizzy setup')} de novo quando quiser mudar algo.
Enter aceita a resposta padrão entre colchetes.`;

const OUTRO = `
${green(bold('Pronto!'))} Configuração salva em gizzycera.config.json. Amostras de voz em voice-samples/.

Próximos passos (dentro de core/):
  npx gizzy check   <pasta-do-projeto>
  npx gizzy produce <pasta-do-projeto>

Para trocar vozes, GPU ou pastas: npx gizzy setup`;

const tools = () => import('../composition/install.ts');

type ConfigStore = Readonly<{ exists(): boolean; load(): GizzyConfig; save(config: GizzyConfig): void }>;

async function context(args: readonly string[], file: ConfigStore): Promise<SetupContext> {
  const { defaults } = await tools();
  const hasFile = file.exists();
  const previous = hasFile ? file.load() : defaults();
  const dryRun = args.includes('--dry-run');
  const prompter = Prompter.open(dryRun || args.includes('--defaults') || args.includes('--padrao'));
  return { prompter, previous, hasFile, dryRun, config: structuredClone(previous), gpu: null };
}

async function questions(setup: SetupContext): Promise<void> {
  checkNode();
  await modelsFolder(setup);
  await hardware(setup);
  await voiceChoices(setup);
  await pronunciationCheck(setup);
  await remotionLicense(setup);
}

/** `configPath`: another gizzycera.config.json than the repository one (tests). */
export async function setupCommand(args: readonly string[], configPath?: string): Promise<void> {
  if (args.includes('--help')) return console.log(SETUP_USAGE);
  console.log(INTRO);
  const file = (await tools()).configFile(configPath);
  const setup = await context(args, file);
  const save = (config: GizzyConfig) => (setup.dryRun ? undefined : file.save(config));
  try {
    await questions(setup);
    save(setup.config);
    await downloadAndTest(setup, save);
  } finally {
    setup.prompter.close();
  }
  console.log(setup.dryRun ? `\n(simulação) gizzycera.config.json ficaria assim:\n${JSON.stringify(setup.config, null, 2)}` : OUTRO);
}
