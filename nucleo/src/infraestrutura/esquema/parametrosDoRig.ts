import type { CatalogoDeRigs, DefinicaoDeParametro, DefinicaoDeParametros } from '../../aplicacao/portas/CatalogoDeRigs.ts';
import type { ValorDeParametro } from '../../dominio/elenco/Personagem.ts';
import { CorHex } from '../../dominio/valores/CorHex.ts';
import type { PersonagemJson } from './esquemaDoPersonagem.ts';
import type { ColetorDeProblemas } from './mensagensDeErro.ts';
import { mensagemDoDominio } from './refinamentos.ts';

type Parametros = Record<string, ValorDeParametro>;
type Validador = (valor: ValorDeParametro, definicao: DefinicaoDeParametro) => string | undefined;
type Origem = Readonly<{ arquivo: string; coletor: ColetorDeProblemas }>;

const cor: Validador = (valor) =>
  typeof valor === 'string' ? mensagemDoDominio(() => CorHex.de(valor)) : `esperava uma cor em texto, veio ${valor}`;

const numero: Validador = (valor, { min = -Infinity, max = Infinity }) => {
  if (typeof valor !== 'number') return `esperava um número, veio ${JSON.stringify(valor)}`;
  return valor >= min && valor <= max ? undefined : `número ${valor} fora de ${min} a ${max}`;
};

const opcao: Validador = (valor, { opcoes = [] }) =>
  opcoes.includes(String(valor)) ? undefined : `opção ${JSON.stringify(valor)} inválida (use ${opcoes.join(', ')})`;

const booleano: Validador = (valor) =>
  typeof valor === 'boolean' ? undefined : `esperava verdadeiro ou falso, veio ${JSON.stringify(valor)}`;

const VALIDADORES = { cor, numero, opcao, booleano } as const;

function validarConhecidos(definicoes: DefinicaoDeParametros, parametros: Parametros, origem: Origem): void {
  Object.entries(parametros).forEach(([nome, valor]) => {
    const definicao = definicoes[nome];
    const mensagem = definicao && VALIDADORES[definicao.tipo](valor, definicao);
    if (mensagem) origem.coletor.adicionar({ arquivo: origem.arquivo, caminho: `parametros.${nome}`, mensagem });
  });
}

function recusarDesconhecidos(json: PersonagemJson, definicoes: DefinicaoDeParametros, origem: Origem): void {
  const validos = Object.keys(definicoes);
  Object.keys(json.parametros)
    .filter((nome) => !validos.includes(nome))
    .forEach((nome) => origem.coletor.adicionar({
      arquivo: origem.arquivo,
      caminho: `parametros.${nome}`,
      mensagem: `parâmetro desconhecido no rig "${json.rig}" (use ${validos.join(', ')})`,
    }));
}

function comPadroes(definicoes: DefinicaoDeParametros, parametros: Parametros): Parametros {
  const padroes = Object.entries(definicoes).map(([nome, definicao]) => [nome, definicao.padrao]);
  return { ...Object.fromEntries(padroes), ...parametros };
}

/** Valida os parâmetros com a definição do rig e completa os ausentes com o padrão. */
export function parametrosDoRig(json: PersonagemJson, catalogo: CatalogoDeRigs, origem: Origem): Parametros {
  const definicoes = catalogo.definicao(json.rig);
  if (!definicoes) {
    const mensagem = `rig "${json.rig}" desconhecido (use ${catalogo.ids().join(', ')})`;
    origem.coletor.adicionar({ arquivo: origem.arquivo, caminho: 'rig', mensagem });
    return json.parametros;
  }
  recusarDesconhecidos(json, definicoes, origem);
  validarConhecidos(definicoes, json.parametros, origem);
  return comPadroes(definicoes, json.parametros);
}
