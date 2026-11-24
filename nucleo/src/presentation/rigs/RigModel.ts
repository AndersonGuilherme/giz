import type { FC } from 'react';
import type { DefinicaoDeParametros } from '../../aplicacao/portas/CatalogoDeRigs.ts';
import type { ValorDeParametro } from '../../dominio/elenco/Personagem.ts';
import type { EstadoDoPersonagem } from '../../dominio/personagem/EstadoDoPersonagem.ts';

/** Parameters already validated against the rig definition, with defaults applied. */
export type ValidatedParameters = Readonly<Record<string, ValorDeParametro>>;

/** `height` in pixels of the whole character; `side` 1 turns the face to the right of the screen, -1 to the left. */
export type RigProps = Readonly<{ state: EstadoDoPersonagem; parameters: ValidatedParameters; height: number; side: -1 | 1 }>;

/** What Node (CLI, cast validation) needs to know about a rig, without React. */
export type RigDefinition = Readonly<{ id: string; name: Readonly<{ 'pt-BR': string; en: string }>; parameters: DefinicaoDeParametros }>;

/** The full rig, with the component that draws it (only in the Remotion bundle). */
export interface RigModel extends RigDefinition {
  readonly Component: FC<RigProps>;
}
