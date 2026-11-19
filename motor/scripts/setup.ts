// Onboarding guiado do giz: pergunta o necessário, baixa o que falta e testa tudo NESTA máquina.
// O resultado fica em giz.config.json (individual, fora do git). Pode rodar de novo a qualquer momento.
// Uso: npm run setup                 (interativo)
//      npm run setup -- --padrao     (aceita todas as respostas padrão, sem perguntar)
import { mkdirSync, statfsSync, writeFileSync, existsSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { CONFIG_PATH, DEFAULTS, ROOT, loadConfig, saveConfig, type GizConfig } from './config.ts';

const auto = process.argv.includes('--padrao') || !stdin.isTTY;
const rl = auto ? null : createInterface({ input: stdin, output: stdout });
const B = (s: string) => `\x1b[1m${s}\x1b[0m`, G = (s: string) => `\x1b[32m${s}\x1b[0m`, Y = (s: string) => `\x1b[33m${s}\x1b[0m`, D = (s: string) => `\x1b[2m${s}\x1b[0m`;

async function ask(q: string, def: string): Promise<string> {
  if (!rl) { console.log(`${q} ${D(`[${def}]`)} → ${def}`); return def; }
  const a = (await rl.question(`${q} ${D(`[${def}]`)} `)).trim();
  return a || def;
}
async function yes(q: string, def = true): Promise<boolean> {
  const a = (await ask(`${q} (s/n)`, def ? 's' : 'n')).toLowerCase();
  return a.startsWith('s') || a.startsWith('y');
}
async function choose<T extends string>(q: string, options: Array<{ value: T; label: string }>, def: T): Promise<T> {
  console.log(q);
  options.forEach((o, i) => console.log(`  ${i + 1}) ${o.label}${o.value === def ? D('  (padrão)') : ''}`));
  const a = await ask('Escolha o número', String(options.findIndex((o) => o.value === def) + 1));
  return options[Number(a) - 1]?.value ?? def;
}
const step = (n: number, total: number, title: string) => console.log(`\n${B(`[${n}/${total}] ${title}`)}`);
const freeGB = (dir: string) => { try { const s = statfsSync(dir); return (s.bavail * s.bsize) / 1e9; } catch { return NaN; } };

// erro de pronúncia em pt-BR medido com o Whisper (scripts/voice-lab.ts, 4 frases): menor = mais claro
const VOICES: Array<{ value: string; label: string; gender: 'f' | 'm' }> = [
  { value: 'vivian', label: 'vivian   — feminina, jovem e marcante · pt-BR muito claro (erro 2,6%)', gender: 'f' },
  { value: 'ono_anna', label: 'ono_anna — feminina, leve e brincalhona · pt-BR muito claro (erro 2,6%)', gender: 'f' },
  { value: 'serena', label: 'serena   — feminina, calorosa e suave · pt-BR bom (erro 7,7%)', gender: 'f' },
  { value: 'sohee', label: 'sohee    — feminina, calorosa e expressiva · pt-BR com sotaque (erro 12,8%)', gender: 'f' },
  { value: 'dylan', label: 'dylan    — masculina, jovem e natural · pt-BR muito claro (erro 2,6%)', gender: 'm' },
  { value: 'ryan', label: 'ryan     — masculina, dinâmica e ritmada · pt-BR claro (erro 5,1%)', gender: 'm' },
  { value: 'eric', label: 'eric     — masculina, viva e levemente rouca · pt-BR bom (erro 7,7%)', gender: 'm' },
  { value: 'aiden', label: 'aiden    — masculina, clara e ensolarada · pt-BR com sotaque (erro 12,8%)', gender: 'm' },
  { value: 'uncle_fu', label: 'uncle_fu — masculina, grave e madura · pt-BR com sotaque (erro 12,8%)', gender: 'm' },
];
const LANGS = ['portuguese', 'english', 'spanish', 'french', 'german', 'italian', 'russian', 'japanese', 'korean', 'chinese'];

const TOTAL = 7;
console.log(`
${B('✏️  giz — configuração desta instalação')}

Vou fazer algumas perguntas e preparar tudo para você gerar videoaulas ${B('neste computador')}.
Nada aqui usa conta, chave de API ou serviço pago. As respostas ficam em ${B('giz.config.json')}
(só seu, fora do git). Pode rodar ${B('npm run setup')} de novo quando quiser mudar algo.
Enter aceita a resposta padrão entre colchetes.`);

const prev = existsSync(CONFIG_PATH) ? loadConfig() : DEFAULTS;
const cfg: GizConfig = structuredClone(prev);

// 1 · Node
step(1, TOTAL, 'Verificando o Node.js');
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 18)) { console.log(Y(`Node ${process.versions.node} é antigo. Instale o Node 22.18+ (https://nodejs.org) e rode de novo.`)); process.exit(1); }
console.log(G(`✔ Node ${process.versions.node}`));

// 2 · pasta dos modelos
step(2, TOTAL, 'Onde guardar os modelos de IA');
console.log('A voz usa o modelo aberto Qwen3-TTS (5,9 GB ou 13,4 GB, você escolhe no passo 4), baixado uma única vez. Com GPU, mais ~1,8 GB de bibliotecas CUDA.');
cfg.modelsDir = await ask('Pasta dos modelos', prev.modelsDir);
mkdirSync(cfg.modelsDir, { recursive: true });
const free = freeGB(cfg.modelsDir);
console.log(free < 10 ? Y(`⚠ só ${free.toFixed(0)} GB livres nessa pasta (recomendado: 10 GB)`) : G(`✔ ${free.toFixed(0)} GB livres`));

// 3 · hardware
step(3, TOTAL, 'Hardware: CPU ou GPU');
const ramGB = totalmem() / 1e9;
console.log(`CPU: ${cpus().length} núcleos · RAM: ${ramGB.toFixed(0)} GB${ramGB < 12 ? Y('  (a voz usa ~7 GB de RAM: feche outros programas ao gerar)') : ''}`);
const gpu = await import('./gpu.ts');
const nv = gpu.detectNvidia();
cfg.device = 'cpu';
if (nv) {
  console.log(G(`✔ GPU NVIDIA encontrada: ${nv.name} (${(nv.memoryMiB / 1024).toFixed(0)} GB, driver ${nv.driver})`));
  if (await yes('Usar a GPU para gerar as vozes? Bem mais rápido; baixa ~1,8 GB de bibliotecas da NVIDIA (sem sudo)', true)) {
    try {
      await gpu.installGpu();
      cfg.device = 'cuda';
      console.log(G('✔ bibliotecas CUDA instaladas (o teste real é no passo 7)'));
    } catch (e) {
      console.log(Y(`⚠ não consegui preparar a GPU: ${(e as Error).message}\n  Seguindo com CPU. Você pode tentar de novo depois com npm run setup.`));
    }
  }
} else {
  console.log('Nenhuma GPU NVIDIA detectada (ou o driver não está instalado). A voz vai rodar na CPU: funciona, só é mais lenta.');
}
if (cfg.device === 'cpu') {
  const t = await ask('Quantos núcleos da CPU usar para a voz? (0 = todos)', String(prev.threads));
  cfg.threads = Math.max(0, Number(t) || 0);
}

// 4 · modelo, canal, idioma, vozes e estilos
step(4, TOTAL, 'Modelo de voz, seu canal, idioma e vozes de Lia e Téo');
const { QWEN_MODELS } = await import('./qwen3-tts.ts');
const bigOk = cfg.device === 'cuda' ? (nv?.memoryMiB ?? 0) >= 14000 : ramGB >= 24;
console.log(`Há dois tamanhos do modelo de voz (as mesmas 9 vozes):
  0.6b — ${QWEN_MODELS['0.6b'].gb} GB, mais leve e rápido
  1.7b — ${QWEN_MODELS['1.7b'].gb} GB, fala mais natural e aceita INSTRUÇÕES DE ESTILO ("fale empolgado", "mais grave")
         precisa de ~13 GB de memória de vídeo (GPU) ou ~20 GB de RAM (CPU, bem mais lento)`);
cfg.model = await choose('Qual modelo?', [
  { value: '0.6b', label: '0.6b (leve)' },
  { value: '1.7b', label: `1.7b (melhor)${bigOk ? '' : '  ⚠ seu hardware pode não ter memória suficiente'}` },
], existsSync(CONFIG_PATH) ? prev.model : bigOk ? '1.7b' : '0.6b');
cfg.brand = await ask('Nome do seu canal ou marca (aparece no canto dos vídeos)', prev.brand);
cfg.language = await choose('Idioma da narração:', LANGS.map((l) => ({ value: l, label: l })), prev.language);
console.log(D('As vozes prontas do modelo são nativas de outros idiomas, mas falam todos os 10. Dá para ouvir amostras no passo 7.'));
cfg.voices.lia = await choose('Voz da Lia (mentora):', VOICES.filter((v) => v.gender === 'f'), prev.voices.lia);
cfg.voices.teo = await choose('Voz do Téo (dev curioso):', VOICES.filter((v) => v.gender === 'm'), prev.voices.teo);
if (cfg.model === '1.7b') {
  console.log(D('Instrução de estilo: como cada personagem fala, em linguagem natural (pode ser em português). Vazio = sem instrução.'));
  cfg.styles.lia = await ask('Estilo da Lia', prev.styles.lia || 'Fale de forma calorosa, confiante e didática, como uma professora experiente');
  cfg.styles.teo = await ask('Estilo do Téo', prev.styles.teo || 'Fale com energia e curiosidade, como um jovem desenvolvedor animado');
}

// 5 · controle de qualidade
step(5, TOTAL, 'Controle de qualidade da pronúncia (opcional)');
console.log('O Whisper (modelo aberto, ~250 MB, roda local) "escuta" as vozes geradas e aponta palavras mal pronunciadas.');
cfg.qa = await yes('Ativar no `npm run produce`?', prev.qa);

// 6 · Remotion
step(6, TOTAL, 'Licença do Remotion (o programa que desenha o vídeo)');
console.log('O Remotion é gratuito para pessoa física e para empresas de até 3 pessoas. Acima disso, a empresa precisa da licença paga (remotion.pro).');
cfg.remotionLicense = await choose('Quem vai usar o giz?', [
  { value: 'pessoa-fisica', label: 'eu, como pessoa física' },
  { value: 'empresa-ate-3', label: 'uma empresa com até 3 pessoas' },
  { value: 'empresa-com-licenca', label: 'uma empresa maior que já tem a licença do Remotion' },
], prev.remotionLicense === 'nao-informado' ? 'pessoa-fisica' : prev.remotionLicense);
const conc = await ask('Quadros renderizados em paralelo (vazio = automático)', prev.render.concurrency ? String(prev.render.concurrency) : 'auto');
cfg.render.concurrency = Number(conc) > 0 ? Number(conc) : null;
saveConfig(cfg);

// 7 · baixar e testar
step(7, TOTAL, 'Baixando o modelo de voz e testando');
const { ensureModel, Qwen3TTS, QWEN_RATE } = await import('./qwen3-tts.ts');
await ensureModel();
const wav = (a: Float32Array) => {
  const b = Buffer.alloc(44 + a.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + a.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(QWEN_RATE, 24); b.writeUInt32LE(QWEN_RATE * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(a.length * 2, 40);
  a.forEach((s, i) => b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2));
  return b;
};
let tts: Awaited<ReturnType<typeof Qwen3TTS.load>>;
const test = async () => {
  tts = await Qwen3TTS.load();
  const t = performance.now();
  const a = await tts.generate('Olá! Eu sou a Lia, e este é o Téo.', { speaker: cfg.voices.lia, language: cfg.language, instruct: cfg.styles.lia || undefined, seed: 7 });
  return { a, secs: (performance.now() - t) / 1000 };
};
let r: Awaited<ReturnType<typeof test>>;
try { r = await test(); } catch (e) {
  if (cfg.device !== 'cuda') throw e;
  console.log(Y(`⚠ a GPU falhou no teste (${(e as Error).message.split('\n')[0]}). Voltando para CPU.`));
  cfg.device = 'cpu'; saveConfig(cfg);
  process.env.GIZ_DEVICE = 'cpu';
  r = await test();
}
const sampleDir = join(ROOT, 'amostras-de-voz');
mkdirSync(sampleDir, { recursive: true });
writeFileSync(join(sampleDir, `lia-${cfg.voices.lia}.wav`), wav(r.a));
const ratio = r.secs / (r.a.length / QWEN_RATE);
console.log(G(`✔ voz funcionando em ${cfg.device === 'cuda' ? 'GPU' : 'CPU'}: ${ratio.toFixed(1)} s para gerar cada 1 s de fala`));
if (await yes('Gerar amostras de TODAS as vozes para você ouvir e comparar? (~1 min por voz em CPU)', false)) {
  for (const v of VOICES) {
    const style = v.gender === 'f' ? cfg.styles.lia : cfg.styles.teo;
    const a = await tts!.generate('Então como uma consulta de frete disparou três mil e-mails?', { speaker: v.value, language: cfg.language, instruct: style || undefined, seed: 7 });
    writeFileSync(join(sampleDir, `${v.value}.wav`), wav(a));
    console.log(`  ${v.value}.wav`);
  }
}
if (cfg.qa) {
  console.log('Baixando o Whisper...');
  await (await import('./asr-check.ts')).makeAsr();
  console.log(G('✔ Whisper pronto'));
}
rl?.close();

console.log(`
${G(B('Pronto!'))} Configuração salva em giz.config.json. Amostras de voz em amostras-de-voz/.

Próximos passos:
  npm run novo-curso -- meu-curso "Título do curso"
  npm run nova-aula  -- meu-curso primeira-aula "Título da aula"
  npm run render     -- ../cursos/meu-curso/aulas/01-primeira-aula

Para trocar vozes, GPU ou pastas: npm run setup`);
