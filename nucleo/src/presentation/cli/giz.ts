// Uso: node src/apresentacao/cli/giz.ts <subcomando> [argumentos]
import { resolve } from 'node:path';
import type { Progresso } from '../../aplicacao/casos-de-uso/GerarVozes.ts';
import type { Problema } from '../../aplicacao/casos-de-uso/VerificarProjeto.ts';
import { gerarVozes, repositorioDeProjeto, verificarProjeto } from './composicao.ts';

type Subcomando = (argumentos: readonly string[]) => Promise<void>;

class ErroDeUso extends Error {}

function mostrarProgresso({ feitas, total, idFala, gerada }: Progresso): void {
  console.log(`fala ${idFala} (${feitas}/${total}): ${gerada ? 'voz gerada' : 'já em dia'}`);
}

async function voz([pasta]: readonly string[]): Promise<void> {
  if (!pasta) throw new ErroDeUso('uso: giz voz <pasta-do-projeto>');
  const caminho = resolve(pasta);
  const projeto = await repositorioDeProjeto().carregar(caminho);
  const relatorio = await gerarVozes(caminho, projeto).executar(projeto, mostrarProgresso);
  console.log(`${relatorio.geradas.length} gerada(s), ${relatorio.puladas.length} já em dia`);
}

function linhaDoProblema(nivel: 'ERRO' | 'AVISO', { fala, mensagem }: Problema): string {
  return fala ? `${nivel} fala ${fala}: ${mensagem}` : `${nivel}: ${mensagem}`;
}

async function check([pasta]: readonly string[]): Promise<void> {
  if (!pasta) throw new ErroDeUso('uso: giz check <pasta-do-projeto>');
  const projeto = await repositorioDeProjeto().carregar(resolve(pasta));
  const { erros, avisos } = verificarProjeto().executar(projeto);
  erros.forEach((erro) => console.log(linhaDoProblema('ERRO', erro)));
  avisos.forEach((aviso) => console.log(linhaDoProblema('AVISO', aviso)));
  console.log(`${erros.length} erro(s), ${avisos.length} aviso(s)`);
  if (erros.length > 0) process.exitCode = 1;
}

const SUBCOMANDOS: Readonly<Record<string, Subcomando>> = { voz, check };

async function principal([nome = '', ...argumentos]: readonly string[]): Promise<void> {
  const subcomando = SUBCOMANDOS[nome];
  if (!subcomando) throw new ErroDeUso(`uso: giz <${Object.keys(SUBCOMANDOS).join(' | ')}> [argumentos]`);
  await subcomando(argumentos);
}

// Erros viram mensagem legível, sem stack trace; erro de uso sai com 2, os demais com 1.
try {
  await principal(process.argv.slice(2));
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : String(erro));
  process.exitCode = erro instanceof ErroDeUso ? 2 : 1;
}
