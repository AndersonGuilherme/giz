import { AreaSegura } from '../../dominio/layout/AreaSegura.ts';
import type { Caixa } from '../../dominio/layout/Caixa.ts';
import { Caixas } from '../../dominio/layout/Caixas.ts';
import { caixaDaLegenda } from '../../dominio/layout/layoutsDeAula.ts';
import type { RegistroDeLayouts } from '../../dominio/layout/RegistroDeLayouts.ts';
import type { Projeto } from '../../dominio/projeto/Projeto.ts';
import type { Fala } from '../../dominio/roteiro/Fala.ts';

/** `fala` vazio: o problema é do projeto (por exemplo, um aviso da carga). */
export type Problema = Readonly<{ fala: string; mensagem: string }>;
export type RelatorioDeVerificacao = { erros: Problema[]; avisos: Problema[] };
type Dependencias = Readonly<{ layouts: RegistroDeLayouts }>;

function mensagensDeLayout(caixas: Caixas, areaSegura: Caixa): string[] {
  const naoCabem = caixas.textosQueNaoCabem().map((caixa) => `${caixa.rotulo} não cabe na caixa nem com a letra a 60%`);
  const sobrepostas = caixas.sobreposicoes().map(([primeira, segunda]) => `${primeira.rotulo} sobrepõe ${segunda.rotulo}`);
  const fora = caixas.foraDe(areaSegura).map((caixa) => `${caixa.rotulo} sai da área segura`);
  return [...naoCabem, ...sobrepostas, ...fora];
}

/** Acusa texto que não cabe, caixas sobrepostas e o que sai da área segura, fala por fala. */
export class VerificarProjeto {
  readonly #dependencias: Dependencias;

  constructor(dependencias: Dependencias) {
    this.#dependencias = dependencias;
  }

  executar(projeto: Projeto): RelatorioDeVerificacao {
    const roteiro = projeto.roteiro();
    const falas = roteiro.falas();
    const areaSegura = AreaSegura.para(projeto.proporcao());
    const erros = falas.cadaUma().flatMap((fala) => this.#errosDaFala(projeto, fala, areaSegura));
    const avisos = projeto.avisos().map((mensagem) => ({ fala: '', mensagem }));
    return { erros, avisos };
  }

  #errosDaFala(projeto: Projeto, fala: Fala, areaSegura: Caixa): Problema[] {
    const legenda = caixaDaLegenda(fala.texto(), projeto.proporcao());
    const caixas = this.#caixasDaCena(projeto, fala).com(legenda);
    return mensagensDeLayout(caixas, areaSegura).map((mensagem) => ({ fala: fala.id(), mensagem }));
  }

  // Só a fala que declara a cena a verifica: quem herda a cena não repete os mesmos erros.
  // Provisório: cenas ainda sem layout registrado (Tasks 12 e 13) são puladas, sem erro.
  #caixasDaCena(projeto: Projeto, fala: Fala): Caixas {
    const cena = fala.cena();
    if (!cena) return Caixas.vazias();
    const { layouts } = this.#dependencias;
    return layouts.caixasDe(cena, projeto.proporcao(), projeto.idioma()) ?? Caixas.vazias();
  }
}
