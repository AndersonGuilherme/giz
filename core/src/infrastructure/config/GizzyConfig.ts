import { join } from 'node:path';

// The INDIVIDUAL configuration of each Gizzycera install (GPU, voices, folders...), in gizzycera.config.json at the repository
// root. `gizzy setup` creates it and it stays out of git. The keys are the motor's, so existing installs keep working.
export type GizzyConfig = {
  /** The channel or brand name shown in the corner of the videos. */
  brand: string;
  /** Voice model: '0.6b' (5.9 GB, lighter) or '1.7b' (13.4 GB, better, follows style instructions). */
  model: '0.6b' | '1.7b';
  /** Where the voice runs: 'cuda' (NVIDIA GPU) or 'cpu'. */
  device: 'cpu' | 'cuda';
  /** CPU cores for the voice (0 = automatic). */
  threads: number;
  /** Folder of the downloaded AI models (voice, CUDA libraries). */
  modelsDir: string;
  /** Narration language for the setup test and the QA labs (Qwen3-TTS ids: portuguese, english, spanish...). */
  language: string;
  /** Qwen3-TTS voice of the motor presenters (lessons converted from the motor). */
  voices: { lia: string; teo: string };
  /** Style instruction of each presenter (1.7B model only). */
  styles: { lia: string; teo: string };
  /** Pronunciation check with Whisper when producing a course. */
  qa: boolean;
  /** Video render (Remotion): frames in parallel (null = Remotion default). */
  render: { concurrency: number | null };
  /** Who uses it: decides whether the free Remotion license applies. */
  remotionLicense: 'pessoa-fisica' | 'empresa-ate-3' | 'empresa-com-licenca' | 'nao-informado';
};

export type Environment = Readonly<Record<string, string | undefined>>;

export function defaultConfig(home: string): GizzyConfig {
  return {
    brand: 'gizzycera',
    model: '0.6b',
    device: 'cpu',
    threads: 0,
    modelsDir: join(home, '.cache', 'gizzycera'),
    language: 'portuguese',
    voices: { lia: 'vivian', teo: 'dylan' },
    styles: { lia: '', teo: '' },
    qa: false,
    render: { concurrency: null },
    remotionLicense: 'nao-informado',
  };
}

// Environment variables win (handy for one-off tests): GIZZY_MODELS_DIR and GIZZY_DEVICE=cpu|cuda.
function withEnvironment(config: GizzyConfig, env: Environment): GizzyConfig {
  const device = env.GIZZY_DEVICE === 'cpu' || env.GIZZY_DEVICE === 'cuda' ? env.GIZZY_DEVICE : config.device;
  return { ...config, device, modelsDir: env.GIZZY_MODELS_DIR ?? config.modelsDir };
}

/** The defaults, then the file keys (nested objects merged key by key), then the environment. */
export function mergedConfig(file: Partial<GizzyConfig>, sources: Readonly<{ env: Environment; home: string }>): GizzyConfig {
  const defaults = defaultConfig(sources.home);
  const merged = {
    ...defaults,
    ...file,
    voices: { ...defaults.voices, ...file.voices },
    styles: { ...defaults.styles, ...file.styles },
    render: { ...defaults.render, ...file.render },
  };
  return withEnvironment(merged, sources.env);
}
