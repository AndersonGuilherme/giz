import { totalmem } from 'node:os';
import type { SetupContext } from './setupContext.ts';
import { TOTAL_STEPS } from './setupContext.ts';
import { dim, step } from './prompts.ts';
import { DEFAULT_STYLES, LANGUAGES, LICENSES, VOICES } from './voiceCatalog.ts';

// Steps 4–6 of `giz setup`: voice model, channel, language and voices; the pronunciation check; the Remotion license.
const modelGigabytes = async (model: '0.6b' | '1.7b') => (await import('../composition/tools.ts')).modelGigabytes(model);

// The 1.7B needs ~13 GB of video memory (GPU) or ~20 GB of RAM (CPU).
function bigModelFits({ config, gpu }: SetupContext): boolean {
  if (config.device === 'cuda') return (gpu?.memoryMiB ?? 0) >= 14000;
  return totalmem() / 1e9 >= 24;
}

async function chooseModel(context: SetupContext): Promise<void> {
  const fits = bigModelFits(context);
  console.log(`Há dois tamanhos do modelo de voz (as mesmas 9 vozes):
  0.6b — ${await modelGigabytes('0.6b')} GB, mais leve e rápido
  1.7b — ${await modelGigabytes('1.7b')} GB, fala mais natural e aceita INSTRUÇÕES DE ESTILO ("fale empolgado", "mais grave")
         precisa de ~13 GB de memória de vídeo (GPU) ou ~20 GB de RAM (CPU, bem mais lento)`);
  const options = [{ value: '0.6b', label: '0.6b (leve)' }, { value: '1.7b', label: `1.7b (melhor)${fits ? '' : '  ⚠ seu hardware pode não ter memória suficiente'}` }] as const;
  const suggested = fits ? '1.7b' : '0.6b';
  context.config.model = await context.prompter.choose('Qual modelo?', options, context.hasFile ? context.previous.model : suggested);
}

async function chooseStyles({ prompter, previous, config }: SetupContext): Promise<void> {
  if (config.model !== '1.7b') return;
  console.log(dim('Instrução de estilo: como cada personagem fala, em linguagem natural (pode ser em português). Vazio = sem instrução.'));
  config.styles.lia = await prompter.ask('Estilo da Lia', previous.styles.lia || DEFAULT_STYLES.lia);
  config.styles.teo = await prompter.ask('Estilo do Téo', previous.styles.teo || DEFAULT_STYLES.teo);
}

export async function voiceChoices(context: SetupContext): Promise<void> {
  step(4, TOTAL_STEPS, 'Modelo de voz, seu canal, idioma e vozes de Lia e Téo');
  const { prompter, previous, config } = context;
  await chooseModel(context);
  config.brand = await prompter.ask('Nome do seu canal ou marca (aparece no canto dos vídeos)', previous.brand);
  config.language = await prompter.choose('Idioma da narração:', LANGUAGES.map((language) => ({ value: language, label: language })), previous.language);
  console.log(dim('As vozes prontas do modelo são nativas de outros idiomas, mas falam todos os 10. Dá para ouvir amostras no passo 7.'));
  config.voices.lia = await prompter.choose('Voz da Lia (mentora):', VOICES.filter((voice) => voice.gender === 'f'), previous.voices.lia);
  config.voices.teo = await prompter.choose('Voz do Téo (dev curioso):', VOICES.filter((voice) => voice.gender === 'm'), previous.voices.teo);
  await chooseStyles(context);
}

export async function pronunciationCheck({ prompter, previous, config }: SetupContext): Promise<void> {
  step(5, TOTAL_STEPS, 'Controle de qualidade da pronúncia (opcional)');
  console.log('O Whisper (modelo aberto, ~250 MB, roda local) "escuta" as vozes geradas e aponta palavras mal pronunciadas.');
  config.qa = await prompter.yes('Ativar na produção dos cursos?', previous.qa);
}

export async function remotionLicense({ prompter, previous, config }: SetupContext): Promise<void> {
  step(6, TOTAL_STEPS, 'Licença do Remotion (o programa que desenha o vídeo)');
  console.log('O Remotion é gratuito para pessoa física e para empresas de até 3 pessoas. Acima disso, a empresa precisa da licença paga (remotion.pro).');
  const declared = previous.remotionLicense === 'nao-informado' ? 'pessoa-fisica' : previous.remotionLicense;
  config.remotionLicense = await prompter.choose('Quem vai usar o giz?', LICENSES, declared);
  const parallel = await prompter.ask('Quadros renderizados em paralelo (vazio = automático)', previous.render.concurrency ? String(previous.render.concurrency) : 'auto');
  config.render.concurrency = Number(parallel) > 0 ? Number(parallel) : null;
}
