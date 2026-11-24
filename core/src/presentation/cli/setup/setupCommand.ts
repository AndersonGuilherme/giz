import type { GizConfig } from '../composition/install.ts';
import { hardware, checkNode, modelsFolder } from './machineSteps.ts';
import { pronunciationCheck, remotionLicense, voiceChoices } from './choiceSteps.ts';
import { bold, green, Prompter } from './prompts.ts';
import type { SetupContext } from './setupContext.ts';
import { downloadAndTest } from './voiceTestStep.ts';

// The guided onboarding of giz (`giz setup`, the motor's `npm run setup`): asks what is needed, downloads what is
// missing and tests everything ON THIS machine. The answers go to giz.config.json (individual, out of git).
export const SETUP_USAGE = `uso: giz setup [--defaults] [--dry-run]
  --defaults   aceita todas as respostas padrão, sem perguntar (o mesmo que rodar sem terminal; --padrao também vale)
  --dry-run    mostra as perguntas e a configuração que resultaria, sem gravar, baixar nem instalar nada`;

const INTRO = `
${bold('✏️  giz — configuração desta instalação')}

Vou fazer algumas perguntas e preparar tudo para você gerar vídeos ${bold('neste computador')}.
A voz local não usa conta, chave de API nem serviço pago. As respostas ficam em ${bold('giz.config.json')}
(só seu, fora do git). Pode rodar ${bold('npx giz setup')} de novo quando quiser mudar algo.
Enter aceita a resposta padrão entre colchetes.`;

const OUTRO = `
${green(bold('Pronto!'))} Configuração salva em giz.config.json. Amostras de voz em voice-samples/.

Próximos passos (dentro de core/):
  npx giz check   <pasta-do-projeto>
  npx giz produce <pasta-do-projeto>

Para trocar vozes, GPU ou pastas: npx giz setup`;

const tools = () => import('../composition/install.ts');

async function context(args: readonly string[]): Promise<SetupContext> {
  const { configFile, defaults } = await tools();
  const file = configFile();
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

export async function setupCommand(args: readonly string[]): Promise<void> {
  if (args.includes('--help')) return console.log(SETUP_USAGE);
  console.log(INTRO);
  const setup = await context(args);
  const file = (await tools()).configFile();
  const save = (config: GizConfig) => (setup.dryRun ? undefined : file.save(config));
  try {
    await questions(setup);
    save(setup.config);
    await downloadAndTest(setup, save);
  } finally {
    setup.prompter.close();
  }
  console.log(setup.dryRun ? `\n(simulação) giz.config.json ficaria assim:\n${JSON.stringify(setup.config, null, 2)}` : OUTRO);
}
