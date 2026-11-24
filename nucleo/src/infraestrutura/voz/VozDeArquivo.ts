import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PedidoDeVoz, ProvedorVoz } from '../../aplicacao/portas/ProvedorVoz.ts';
import type { Audio } from '../../dominio/fala/Audio.ts';
import { deWav } from './wav.ts';

/** "Gravei minha voz": cada fala vem de `gravacoes/<idFala>.wav`, na pasta do projeto. */
export class VozDeArquivo implements ProvedorVoz {
  readonly #pasta: string;

  constructor(pasta: string) {
    this.#pasta = pasta;
  }

  async gerar(pedido: PedidoDeVoz): Promise<Audio> {
    const caminho = join(this.#pasta, 'gravacoes', `${pedido.idFala}.wav`);
    if (!existsSync(caminho)) throw new Error(`fala ${pedido.idFala}: gravação não encontrada; grave "${pedido.texto}" em ${caminho}`);
    return deWav(await readFile(caminho));
  }
}
