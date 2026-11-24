import type { Alinhador } from '../../aplicacao/portas/Alinhador.ts';
import type { Audio } from '../../dominio/fala/Audio.ts';
import { Envelope } from '../../dominio/fala/Envelope.ts';
import { Palavras } from '../../dominio/fala/Palavras.ts';
import { Fps, Segundos } from '../../dominio/valores/Tempo.ts';

// Pesos de charToFrame do motor (scripts/tts.ts): espaço 0, pontuação 3 (vira pausa), demais letras 1.
const PONTUACAO = /[,;:.!?…]/;
const pesoDaLetra = (letra: string) => (/\s/.test(letra) ? 0 : PONTUACAO.test(letra) ? 3 : 1);
const pesoDaPalavra = (palavra: string) => [...palavra].reduce((soma, letra) => soma + pesoDaLetra(letra), 0);

// Os quadros com voz; sem nenhum, todos os quadros da fala (a contagem é a do envelope).
function quadrosDeFala(envelope: Envelope): number[] {
  const comVoz = envelope.quadrosComVoz();
  const falados = comVoz.flatMap((temVoz, quadro) => (temVoz ? [quadro] : []));
  return falados.length > 0 ? falados : [...comVoz.keys()];
}

// Quadro onde cai o peso acumulado: o começo de um quadro com voz, ou o fim do último.
function fronteira(acumulado: number, total: number, quadros: readonly number[]): number {
  const ultimo = quadros.at(-1) ?? 0;
  if (acumulado >= total) return ultimo + 1;
  return quadros[Math.floor((acumulado / total) * quadros.length)] ?? ultimo;
}

/** Sem reconhecimento de fala: espalha as palavras pelos quadros com voz, proporcional às letras. */
export class AlinhadorPorEnvelope implements Alinhador {
  async alinhar(audio: Audio, texto: string): Promise<Palavras> {
    const palavras = Palavras.doTexto(texto);
    const envelope = Envelope.medir(audio, Fps.PADRAO);
    const quadros = quadrosDeFala(envelope);
    const pesos = palavras.textos().map(pesoDaPalavra);
    const total = Math.max(1, pesos.reduce((soma, peso) => soma + peso, 0));
    const acumulados = pesos.map((_peso, indice) => pesos.slice(0, indice + 1).reduce((soma, peso) => soma + peso, 0));
    const emSegundos = (acumulado: number) =>
      Segundos.de(Math.min(audio.duracao().valor(), fronteira(acumulado, total, quadros) / Fps.PADRAO.valor()));
    const inicios = acumulados.map((acumulado, indice) => emSegundos(acumulado - (pesos[indice] ?? 0)));
    return palavras.comTempos(inicios, acumulados.map(emSegundos));
  }
}
