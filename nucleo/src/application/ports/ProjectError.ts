/** Um problema de validação: o arquivo, o caminho do campo (vazio para o arquivo inteiro) e a mensagem. */
export type Problema = Readonly<{ arquivo: string; caminho: string; mensagem: string }>;

export function linhaDoProblema(problema: Problema): string {
  const local = problema.caminho ? `${problema.arquivo} › ${problema.caminho}` : problema.arquivo;
  return `${local}: ${problema.mensagem}`;
}

export class ErroDeProjeto extends Error {
  readonly problemas: readonly Problema[];

  constructor(problemas: readonly Problema[]) {
    super(`projeto inválido:\n${problemas.map(linhaDoProblema).join('\n')}`);
    this.name = 'ErroDeProjeto';
    this.problemas = problemas;
  }
}
