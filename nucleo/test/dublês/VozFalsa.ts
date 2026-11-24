import type { PedidoDeVoz, ProvedorVoz } from '../../src/aplicacao/portas/ProvedorVoz.ts';
import { Audio } from '../../src/dominio/fala/Audio.ts';

const TAXA = 24000;

/** Silêncio, um começo baixinho (abaixo do limiar de voz do envelope), um tom, um fim baixinho e silêncio. */
function fala(segundosDeTom: number): Float32Array {
  const trechos = [
    { segundos: 0.3, amplitude: 0 },
    { segundos: 0.2, amplitude: 0.015 },
    { segundos: segundosDeTom, amplitude: 0.5 },
    { segundos: 0.2, amplitude: 0.015 },
    { segundos: 0.3, amplitude: 0 },
  ];
  const amostras = trechos.flatMap(({ segundos, amplitude }) =>
    Array.from({ length: Math.round(segundos * TAXA) }, (_, i) => amplitude * Math.sin((2 * Math.PI * 220 * i) / TAXA)),
  );
  return Float32Array.from(amostras);
}

export class VozFalsa implements ProvedorVoz {
  chamadas = 0;
  readonly pedidos: PedidoDeVoz[] = [];

  async gerar(pedido: PedidoDeVoz): Promise<Audio> {
    this.chamadas++;
    this.pedidos.push(pedido);
    return Audio.de(fala(0.05 * pedido.texto.length), TAXA);
  }
}
