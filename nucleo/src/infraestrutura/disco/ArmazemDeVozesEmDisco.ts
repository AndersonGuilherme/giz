import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { arquivoDaVoz, type ArmazemDeVozes, type VozGravada } from '../../aplicacao/portas/ArmazemDeVozes.ts';
import type { Audio } from '../../dominio/fala/Audio.ts';
import { paraWav } from '../voz/wav.ts';

const registroDaVoz = (idFala: string) => `voz/${idFala}.json`;

function hashDoArquivo(caminho: string): string | undefined {
  try {
    return (JSON.parse(readFileSync(caminho, 'utf8')) as Partial<VozGravada>).hash;
  } catch {
    return undefined;
  }
}

/** Grava `voz/<id>.wav` e `voz/<id>.json` dentro da pasta do projeto. */
export class ArmazemDeVozesEmDisco implements ArmazemDeVozes {
  readonly #pasta: string;

  constructor(pasta: string) {
    this.#pasta = pasta;
  }

  // Sem o wav, o registro não vale: a fala é gerada de novo.
  hashGravado(idFala: string): string | undefined {
    if (!existsSync(join(this.#pasta, arquivoDaVoz(idFala)))) return undefined;
    return hashDoArquivo(join(this.#pasta, registroDaVoz(idFala)));
  }

  async gravar(idFala: string, registro: VozGravada, audio: Audio): Promise<void> {
    await mkdir(join(this.#pasta, 'voz'), { recursive: true });
    await writeFile(join(this.#pasta, arquivoDaVoz(idFala)), paraWav(audio));
    await writeFile(join(this.#pasta, registroDaVoz(idFala)), JSON.stringify(registro));
  }

  async ler(idFala: string): Promise<VozGravada> {
    return JSON.parse(await readFile(join(this.#pasta, registroDaVoz(idFala)), 'utf8')) as VozGravada;
  }
}
