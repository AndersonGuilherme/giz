import { Audio } from '../../dominio/fala/Audio.ts';

// WAV PCM de 16 bits. Escreve mono; lê mono ou com mais canais (vira mono pela média).
const TAMANHO_DO_CABECALHO = 44;
const BYTES_POR_AMOSTRA = 2;
const MAXIMO_DE_16_BITS = 32767;
const FORMATOS_PCM = [1, 0xfffe];

type Formato = Readonly<{ codigo: number; canais: number; taxa: number; bits: number }>;

export function paraWav(audio: Audio): Buffer {
  const amostras = audio.amostras();
  const bytesDeDados = amostras.length * BYTES_POR_AMOSTRA;
  const wav = Buffer.alloc(TAMANHO_DO_CABECALHO + bytesDeDados);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + bytesDeDados, 4); wav.write('WAVE', 8);
  wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(audio.taxa(), 24); wav.writeUInt32LE(audio.taxa() * BYTES_POR_AMOSTRA, 28);
  wav.writeUInt16LE(BYTES_POR_AMOSTRA, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(bytesDeDados, 40);
  amostras.forEach((amostra, indice) => {
    const inteiro = Math.max(-32768, Math.min(MAXIMO_DE_16_BITS, Math.round(amostra * MAXIMO_DE_16_BITS)));
    wav.writeInt16LE(inteiro, TAMANHO_DO_CABECALHO + indice * BYTES_POR_AMOSTRA);
  });
  return wav;
}

// Os blocos ("chunks") do RIFF, por nome: "fmt ", "data", e outros que alguns gravadores incluem.
function blocos(wav: Buffer): Map<string, Buffer> {
  const encontrados = new Map<string, Buffer>();
  let posicao = 12;
  while (posicao + 8 <= wav.length) {
    const tamanho = wav.readUInt32LE(posicao + 4);
    encontrados.set(wav.toString('ascii', posicao, posicao + 4), wav.subarray(posicao + 8, posicao + 8 + tamanho));
    posicao += 8 + tamanho + (tamanho % 2);
  }
  return encontrados;
}

function formatoValido(bloco: Buffer | undefined): Formato {
  if (!bloco || bloco.length < 16) throw new Error('arquivo WAV sem o bloco "fmt "');
  const formato = { codigo: bloco.readUInt16LE(0), canais: bloco.readUInt16LE(2), taxa: bloco.readUInt32LE(4), bits: bloco.readUInt16LE(14) };
  if (!FORMATOS_PCM.includes(formato.codigo) || formato.bits !== 16) {
    throw new Error(`o WAV precisa ser PCM de 16 bits (veio formato ${formato.codigo} com ${formato.bits} bits)`);
  }
  return formato;
}

function amostraMono(dados: Buffer, quadro: number, canais: number): number {
  const valores = [...Array(canais).keys()].map((canal) => dados.readInt16LE((quadro * canais + canal) * BYTES_POR_AMOSTRA));
  return valores.reduce((soma, valor) => soma + valor, 0) / canais / 32768;
}

export function deWav(wav: Buffer): Audio {
  if (wav.length < 12 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('não é um arquivo WAV (faltam as marcas RIFF/WAVE)');
  }
  const encontrados = blocos(wav);
  const { canais, taxa } = formatoValido(encontrados.get('fmt '));
  const dados = encontrados.get('data') ?? Buffer.alloc(0);
  const quadros = Math.floor(dados.length / (BYTES_POR_AMOSTRA * canais));
  const amostras = Float32Array.from(Array(quadros).keys(), (quadro) => amostraMono(dados, quadro, canais));
  return Audio.de(amostras, taxa);
}
