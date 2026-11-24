import type { ArmazemDeVozes, VozGravada } from '../../src/aplicacao/portas/ArmazemDeVozes.ts';
import type { Audio } from '../../src/dominio/fala/Audio.ts';

export class ArmazemEmMemoria implements ArmazemDeVozes {
  readonly registros = new Map<string, VozGravada>();
  readonly audios = new Map<string, Audio>();

  hashGravado(idFala: string): string | undefined {
    return this.registros.get(idFala)?.hash;
  }

  async gravar(idFala: string, registro: VozGravada, audio: Audio): Promise<void> {
    this.registros.set(idFala, registro);
    this.audios.set(idFala, audio);
  }

  async ler(idFala: string): Promise<VozGravada> {
    const registro = this.registros.get(idFala);
    if (!registro) throw new Error(`voz da fala ${idFala} não gravada`);
    return registro;
  }
}
