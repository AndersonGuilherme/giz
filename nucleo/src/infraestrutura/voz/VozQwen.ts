import { createHash } from 'node:crypto';
import type { PedidoDeVoz, ProvedorVoz } from '../../aplicacao/portas/ProvedorVoz.ts';
import { Audio } from '../../dominio/fala/Audio.ts';
// temporário até a fase Migração
import { ensureModel, Qwen3TTS, QWEN_MODELS, QWEN_RATE, type QwenModel } from '../../../../motor/scripts/qwen3-tts.ts';

const IDIOMAS_DO_QWEN: Readonly<Record<string, string>> = { 'pt-BR': 'portuguese', en: 'english' };
// 0,9 variava demais a entonação; 0,7 foi escolhido de ouvido no motor (2026-11-19).
const TEMPERATURA = 0.7;

// Semente fixa por fala: o mesmo id e texto geram sempre o mesmo áudio.
function sementeDe(pedido: PedidoDeVoz): number {
  const resumo = createHash('sha1').update(`${pedido.idFala}|${pedido.texto}`).digest('hex');
  return parseInt(resumo.slice(0, 8), 16);
}

async function carregar(modelo: QwenModel | undefined): Promise<Qwen3TTS> {
  if (!modelo) return Qwen3TTS.load();
  return Qwen3TTS.load(await ensureModel(QWEN_MODELS[modelo].repo));
}

/** Voz local e gratuita (Qwen3-TTS). Sem `modelo`, vale o do giz.config.json. */
export class VozQwen implements ProvedorVoz {
  readonly #modelo: QwenModel | undefined;
  #tts: Promise<Qwen3TTS> | undefined;

  constructor(modelo?: QwenModel) {
    this.#modelo = modelo;
  }

  async gerar(pedido: PedidoDeVoz): Promise<Audio> {
    this.#tts ??= carregar(this.#modelo);
    const tts = await this.#tts;
    const amostras = await tts.generate(pedido.texto, {
      speaker: pedido.voz,
      language: IDIOMAS_DO_QWEN[pedido.idioma.codigo()],
      instruct: pedido.estilo || undefined,
      temperature: TEMPERATURA,
      seed: sementeDe(pedido),
    });
    return Audio.de(amostras, QWEN_RATE);
  }
}
