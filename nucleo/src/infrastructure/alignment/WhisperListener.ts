import type { AutomaticSpeechRecognitionPipeline, PretrainedModelOptions } from '@huggingface/transformers';
import type { Audio } from '../../dominio/fala/Audio.ts';
import type { PalavraJson } from '../../dominio/fala/PalavraJson.ts';
import type { Idioma } from '../../dominio/valores/Idioma.ts';
import type { Ouvido } from './AlinhadorWhisper.ts';

// O whisper-small do motor (scripts/asr-check.ts) foi exportado sem as atenções cruzadas e não dá tempo por
// palavra; esta é a mesma rede exportada com elas. Baixa uma vez (~250 MB, q8) para o cache do transformers.
export const MODELO_DO_WHISPER = 'onnx-community/whisper-small_timestamped';
const TAXA_DO_WHISPER = 16000;
const IDIOMAS_DO_WHISPER: Readonly<Record<string, string>> = { 'pt-BR': 'portuguese', en: 'english' };

// A assinatura genérica de `pipeline` estoura o limite de união do tsc; esta é a única forma usada aqui.
type CriarReconhecedor = (tarefa: 'automatic-speech-recognition', modelo: string, opcoes: PretrainedModelOptions) => Promise<AutomaticSpeechRecognitionPipeline>;
type PedacoOuvido = { text: string; timestamp: [number, number | null] };
type Transcricao = { text: string; chunks?: PedacoOuvido[] };

// Interpolação linear para 16 kHz, a taxa que o Whisper espera (igual ao readWav16k do motor).
function reamostrado(audio: Audio): Float32Array {
  const amostras = audio.amostras();
  const razao = audio.taxa() / TAXA_DO_WHISPER;
  const saida = new Float32Array(Math.floor(amostras.length / razao));
  return saida.map((_amostra, indice) => {
    const posicao = indice * razao;
    const antes = Math.floor(posicao);
    const fracao = posicao - antes;
    return (amostras[antes] ?? 0) * (1 - fracao) + (amostras[antes + 1] ?? 0) * fracao;
  });
}

// Import tardio: o onnxruntime do Qwen (com CUDA, vindo do motor) precisa carregar primeiro no processo;
// se o do núcleo (só CPU) carregar antes, a biblioteca nativa dele é reaproveitada e o Qwen não acha a CUDA.
async function carregar(): Promise<AutomaticSpeechRecognitionPipeline> {
  const transformers = await import('@huggingface/transformers');
  const criar = transformers.pipeline as CriarReconhecedor;
  return criar('automatic-speech-recognition', MODELO_DO_WHISPER, { dtype: 'q8', device: 'cpu' });
}

/** Whisper local (CPU): o modelo carrega na primeira fala e é reaproveitado nas seguintes. */
export class OuvidoWhisper implements Ouvido {
  #reconhecedor: Promise<AutomaticSpeechRecognitionPipeline> | undefined;

  async ouvir(audio: Audio, idioma: Idioma): Promise<PalavraJson[]> {
    const reconhecedor = await this.#carregado();
    const opcoes = { language: IDIOMAS_DO_WHISPER[idioma.codigo()], task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30 } as const;
    const transcricao = (await reconhecedor(reamostrado(audio), opcoes)) as Transcricao;
    const duracao = audio.duracao();
    return (transcricao.chunks ?? []).map(({ text, timestamp: [inicio, fim] }) => ({ texto: text, inicio, fim: fim ?? duracao.valor() }));
  }

  // Uma carga só; se ela falhar, a próxima fala tenta de novo em vez de herdar a promessa rejeitada.
  #carregado(): Promise<AutomaticSpeechRecognitionPipeline> {
    this.#reconhecedor ??= carregar().catch((erro: unknown) => {
      this.#reconhecedor = undefined;
      throw erro;
    });
    return this.#reconhecedor;
  }
}
