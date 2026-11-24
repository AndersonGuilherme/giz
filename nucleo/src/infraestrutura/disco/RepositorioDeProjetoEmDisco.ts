import type { CatalogoDeRigs } from '../../aplicacao/portas/CatalogoDeRigs.ts';
import type { RepositorioDeProjeto } from '../../aplicacao/portas/RepositorioDeProjeto.ts';
import { Elenco } from '../../dominio/elenco/Elenco.ts';
import type { Personagem } from '../../dominio/elenco/Personagem.ts';
import type { Projeto } from '../../dominio/projeto/Projeto.ts';
import { esquemaDoPersonagem } from '../esquema/esquemaDoPersonagem.ts';
import { esquemaDoProjeto, type ProjetoJson } from '../esquema/esquemaDoProjeto.ts';
import { esquemaDoRoteiro, type RoteiroJson } from '../esquema/esquemaDoRoteiro.ts';
import { ColetorDeProblemas } from '../esquema/mensagensDeErro.ts';
import { parametrosDoRig } from '../esquema/parametrosDoRig.ts';
import { personagemParaDominio, projetoParaDominio, roteiroParaDominio } from '../esquema/paraDominio.ts';
import { verificarPersonagensEmCena, verificarQuemFala } from '../esquema/referenciasAoElenco.ts';
import { avisosDeImagens } from './avisosDeImagens.ts';
import { lerValidado } from './leituraDeArquivos.ts';

type Lidos = Readonly<{ projeto: ProjetoJson; roteiro: RoteiroJson; personagens: readonly Personagem[] }>;

/** Lê `projeto.json`, `roteiro.json` e `elenco/<id>.json`, valida tudo e devolve o projeto do domínio. */
export class RepositorioDeProjetoEmDisco implements RepositorioDeProjeto {
  readonly #catalogo: CatalogoDeRigs;

  constructor({ catalogo }: Readonly<{ catalogo: CatalogoDeRigs }>) {
    this.#catalogo = catalogo;
  }

  async carregar(pasta: string): Promise<Projeto> {
    const coletor = new ColetorDeProblemas();
    const projeto = await lerValidado({ pasta, arquivo: 'projeto.json', coletor }, esquemaDoProjeto);
    const roteiro = await lerValidado({ pasta, arquivo: 'roteiro.json', coletor }, esquemaDoRoteiro);
    const personagens = await this.#lerPersonagens(pasta, projeto?.elenco ?? [], coletor);
    if (!projeto || !roteiro || !personagens) return coletor.falhar();
    return this.#montar(pasta, { projeto, roteiro, personagens }, coletor);
  }

  async #lerPersonagens(pasta: string, ids: readonly string[], coletor: ColetorDeProblemas) {
    const personagens: (Personagem | undefined)[] = [];
    for (const id of ids) personagens.push(await this.#lerPersonagem(pasta, id, coletor));
    const lidos = personagens.filter((personagem): personagem is Personagem => personagem !== undefined);
    return lidos.length === ids.length ? lidos : undefined;
  }

  async #lerPersonagem(pasta: string, id: string, coletor: ColetorDeProblemas): Promise<Personagem | undefined> {
    const arquivo = `elenco/${id}.json`;
    const json = await lerValidado({ pasta, arquivo, coletor }, esquemaDoPersonagem);
    if (!json) return undefined;
    if (json.id !== id) coletor.adicionar({ arquivo, caminho: 'id', mensagem: `"${json.id}" difere do nome do arquivo (${id})` });
    return personagemParaDominio(json, parametrosDoRig(json, this.#catalogo, { arquivo, coletor }));
  }

  async #montar(pasta: string, lidos: Lidos, coletor: ColetorDeProblemas): Promise<Projeto> {
    const elenco = Elenco.de(lidos.personagens);
    const roteiro = roteiroParaDominio(lidos.roteiro);
    verificarQuemFala(roteiro, elenco, coletor);
    verificarPersonagensEmCena(lidos.roteiro, elenco, coletor);
    coletor.falharSeHouver();
    const avisos = await avisosDeImagens(pasta, lidos.roteiro);
    return projetoParaDominio(lidos.projeto, { elenco, roteiro, avisos });
  }
}
