// Configuração INDIVIDUAL de cada instalação do giz: giz.config.json na raiz do repositório.
// É criada pelo onboarding (`npm run setup`) e NÃO vai para o git: cada pessoa tem a sua (GPU, vozes, pastas...).
// Sem o arquivo, valem os padrões abaixo (CPU, vozes padrão do elenco).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export type GizConfig = {
  /** nome do canal/marca que aparece no canto dos vídeos */
  brand: string;
  /** onde a voz roda: 'cuda' (GPU NVIDIA) ou 'cpu' */
  device: 'cpu' | 'cuda';
  /** núcleos da CPU para a voz (0 = automático) */
  threads: number;
  /** pasta dos modelos de IA baixados (voz, bibliotecas CUDA) */
  modelsDir: string;
  /** idioma da narração (ids do Qwen3-TTS: portuguese, english, spanish...) */
  language: string;
  /** voz do Qwen3-TTS de cada personagem */
  voices: { lia: string; teo: string };
  /** controle de qualidade da pronúncia com Whisper no `npm run produce` */
  qa: boolean;
  /** render do vídeo (Remotion): quadros em paralelo (null = padrão do Remotion) */
  render: { concurrency: number | null };
  /** quem usa: define se a licença gratuita do Remotion se aplica */
  remotionLicense: 'pessoa-fisica' | 'empresa-ate-3' | 'empresa-com-licenca' | 'nao-informado';
};

export const ROOT = resolve(import.meta.dirname, '..', '..');
export const CONFIG_PATH = join(ROOT, 'giz.config.json');

export const DEFAULTS: GizConfig = {
  brand: 'giz',
  device: 'cpu',
  threads: 0,
  modelsDir: join(homedir(), '.cache', 'giz'),
  language: 'portuguese',
  voices: { lia: 'vivian', teo: 'dylan' },
  qa: false,
  render: { concurrency: null },
  remotionLicense: 'nao-informado',
};

let cached: GizConfig | null = null;
export function loadConfig(): GizConfig {
  if (cached) return cached;
  let file: Partial<GizConfig> = {};
  if (existsSync(CONFIG_PATH)) file = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  else if (!process.env.GIZ_QUIET) console.warn('aviso: giz.config.json não encontrado; usando padrões (CPU). Rode `npm run setup` para configurar.');
  cached = { ...DEFAULTS, ...file, voices: { ...DEFAULTS.voices, ...file.voices }, render: { ...DEFAULTS.render, ...file.render } };
  // variáveis de ambiente têm prioridade (útil para testes pontuais)
  if (process.env.GIZ_MODELS_DIR) cached.modelsDir = process.env.GIZ_MODELS_DIR;
  if (process.env.GIZ_DEVICE === 'cpu' || process.env.GIZ_DEVICE === 'cuda') cached.device = process.env.GIZ_DEVICE;
  return cached;
}

export function saveConfig(c: GizConfig) {
  writeFileSync(CONFIG_PATH, JSON.stringify(c, null, 2) + '\n');
  cached = c;
}
