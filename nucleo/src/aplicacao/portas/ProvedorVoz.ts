import type { Audio } from '../../dominio/fala/Audio.ts';
import type { Idioma } from '../../dominio/valores/Idioma.ts';

/** `texto` é o que a voz diz (a pronúncia da fala); `idFala` identifica a fala (gravação própria, semente). */
export type PedidoDeVoz = Readonly<{ idFala: string; texto: string; voz: string; idioma: Idioma; estilo?: string }>;

export interface ProvedorVoz {
  gerar(pedido: PedidoDeVoz): Promise<Audio>;
}
