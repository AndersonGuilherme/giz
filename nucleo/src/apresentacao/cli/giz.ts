// Uso: node src/apresentacao/cli/giz.ts <subcomando> [argumentos]
import { resolve } from 'node:path';
import type { Progresso } from '../../aplicacao/casos-de-uso/GerarVozes.ts';
import { gerarVozes, repositorioDeProjeto } from './composicao.ts';

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

const SUBCOMANDOS: Readonly<Record<string, Subcomando>> = { voz };

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
