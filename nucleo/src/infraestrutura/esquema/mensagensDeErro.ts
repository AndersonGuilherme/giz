import type { ZodIssue } from 'zod';
import { ErroDeProjeto, type Problema } from '../../aplicacao/portas/ErroDeProjeto.ts';

type Tradutor = (issue: ZodIssue) => string | undefined;

const NOMES_DE_TIPO: Record<string, string> = {
  string: 'texto', number: 'número', boolean: 'verdadeiro ou falso', object: 'objeto', array: 'lista', null: 'nulo',
};
const nomeDoTipo = (tipo: string) => NOMES_DE_TIPO[tipo] ?? tipo;

const obrigatorio: Tradutor = (issue) =>
  issue.code === 'invalid_type' && issue.received === 'undefined' ? 'obrigatório' : undefined;
const tipoErrado: Tradutor = (issue) =>
  issue.code === 'invalid_type' ? `esperava ${nomeDoTipo(issue.expected)}, veio ${nomeDoTipo(issue.received)}` : undefined;
const opcaoInvalida: Tradutor = (issue) =>
  issue.code === 'invalid_enum_value' ? `"${issue.received}" inválido (use ${issue.options.join(', ')})` : undefined;
const tipoDeCenaInvalido: Tradutor = (issue) =>
  issue.code === 'invalid_union_discriminator' ? `tipo inválido (use ${issue.options.join(', ')})` : undefined;
const literalInvalido: Tradutor = (issue) =>
  issue.code === 'invalid_literal'
    ? `esperava ${JSON.stringify(issue.expected)}, veio ${JSON.stringify(issue.received)}`
    : undefined;
const pequenoDemais: Tradutor = (issue) => {
  if (issue.code !== 'too_small') return undefined;
  if (issue.type === 'string') return 'não pode ser vazio';
  return issue.type === 'array' ? `precisa de pelo menos ${issue.minimum} item(ns)` : `deve ser no mínimo ${issue.minimum}`;
};
const grandeDemais: Tradutor = (issue) =>
  issue.code === 'too_big' ? `deve ser no máximo ${issue.maximum}` : undefined;

const TRADUTORES = [obrigatorio, tipoErrado, opcaoInvalida, tipoDeCenaInvalido, literalInvalido, pequenoDemais, grandeDemais];

function mensagemDaIssue(issue: ZodIssue): string {
  return TRADUTORES.map((traduzir) => traduzir(issue)).find(Boolean) ?? issue.message;
}

/** `['falas', 0, 'quem']` vira `falas[0].quem`. */
export function caminhoLegivel(partes: readonly (string | number)[]): string {
  return partes.reduce<string>((texto, parte) => {
    if (typeof parte === 'number') return `${texto}[${parte}]`;
    return texto ? `${texto}.${parte}` : parte;
  }, '');
}

function problemasDaIssue(arquivo: string, issue: ZodIssue): Problema[] {
  if (issue.code !== 'unrecognized_keys') {
    return [{ arquivo, caminho: caminhoLegivel(issue.path), mensagem: mensagemDaIssue(issue) }];
  }
  return issue.keys.map((chave) => ({ arquivo, caminho: caminhoLegivel([...issue.path, chave]), mensagem: 'campo desconhecido' }));
}

/** Junta os problemas de todos os arquivos para que saiam de uma vez. */
export class ColetorDeProblemas {
  readonly #problemas: Problema[] = [];

  adicionar(problema: Problema): void {
    this.#problemas.push(problema);
  }

  adicionarDoZod(arquivo: string, issues: readonly ZodIssue[]): void {
    issues.forEach((issue) => this.#problemas.push(...problemasDaIssue(arquivo, issue)));
  }

  falharSeHouver(): void {
    if (this.#problemas.length > 0) this.falhar();
  }

  falhar(): never {
    throw new ErroDeProjeto([...this.#problemas]);
  }
}
