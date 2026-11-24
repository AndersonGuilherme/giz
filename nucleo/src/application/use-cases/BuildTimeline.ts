import { ErroDeDominio } from '../../dominio/ErroDeDominio.ts';
import type { Elenco } from '../../dominio/elenco/Elenco.ts';
import type { Personagem } from '../../dominio/elenco/Personagem.ts';
import type { EfeitoSonoroJson, PersonagemJson, PropsDoVideo, TrechoJson } from '../../dominio/linha-do-tempo/PropsDoVideo.ts';
import { SequenciaDeCenas } from '../../dominio/linha-do-tempo/SequenciaDeCenas.ts';
import type { VozDaFala } from '../../dominio/linha-do-tempo/TemposDaFala.ts';
import { TrechoDeFala } from '../../dominio/linha-do-tempo/TrechoDeFala.ts';
import type { Projeto } from '../../dominio/projeto/Projeto.ts';
import type { Fala } from '../../dominio/roteiro/Fala.ts';
import { Fps } from '../../dominio/valores/Tempo.ts';
import type { ArmazemDeVozes } from '../portas/ArmazemDeVozes.ts';

type Dependencias = Readonly<{ armazem: ArmazemDeVozes }>;
type Montagem = { trechos: TrechoJson[]; efeitosSonoros: EfeitoSonoroJson[]; totalDeQuadros: number };

function falasDo(projeto: Projeto): readonly Fala[] {
  const roteiro = projeto.roteiro();
  const falas = roteiro.falas();
  return falas.cadaUma();
}

function personagemEmJson(personagem: Personagem): PersonagemJson {
  const id = personagem.id();
  const rig = personagem.rig();
  const comum = { id: id.texto(), nome: personagem.nome(), parametros: { ...personagem.parametros() }, expressaoPadrao: personagem.expressaoPadrao() };
  return rig === undefined ? comum : { ...comum, rig };
}

function fichaEmJson(projeto: Projeto) {
  const proporcao = projeto.proporcao();
  const idioma = projeto.idioma();
  const roteiro = projeto.roteiro();
  const marca = projeto.marca();
  return {
    fps: Fps.PADRAO.valor(), largura: proporcao.largura(), altura: proporcao.altura(), idioma: idioma.codigo(), formato: projeto.formato(),
    estiloDeLegenda: projeto.estiloDeLegenda(), ...(marca === undefined ? {} : { marca }), titulo: projeto.titulo(), capitulos: [...roteiro.capitulos()],
  };
}

/** Monta as props do vídeo: cada fala vira um trecho, um depois do outro, com a voz já gravada. */
export class MontarLinhaDoTempo {
  readonly #dependencias: Dependencias;

  constructor(dependencias: Dependencias) {
    this.#dependencias = dependencias;
  }

  async executar(projeto: Projeto): Promise<PropsDoVideo> {
    const falas = falasDo(projeto);
    this.#recusarFalasSemAudio(falas);
    const vozes = await Promise.all(falas.map((fala) => this.#dependencias.armazem.ler(fala.id())));
    const elenco = projeto.elenco();
    const montagem = montarTrechos(falas, vozes, elenco);
    return { ...fichaEmJson(projeto), ...montagem, elenco: elenco.cadaUm().map(personagemEmJson) };
  }

  #recusarFalasSemAudio(falas: readonly Fala[]): void {
    const { armazem } = this.#dependencias;
    const semAudio = falas.filter((fala) => armazem.hashGravado(fala.id()) === undefined);
    if (semAudio.length === 0) return;
    throw new ErroDeDominio(`falas sem áudio: ${semAudio.map((fala) => fala.id()).join(', ')} (gere as vozes antes de montar o vídeo)`);
  }
}

// As falas em sequência: a cena passa de uma para a outra e cada trecho começa onde o anterior acaba.
function montarTrechos(falas: readonly Fala[], vozes: readonly VozDaFala[], elenco: Elenco): Montagem {
  const cenas = new SequenciaDeCenas();
  const montagem: Montagem = { trechos: [], efeitosSonoros: [], totalDeQuadros: 0 };
  falas.forEach((fala, indice) => {
    const voz = vozes[indice] as VozDaFala;
    const trecho = TrechoDeFala.montar(fala, voz, { inicio: montagem.totalDeQuadros, cena: cenas.cenaDe(fala), elenco });
    cenas.continuarCom(trecho.cenaDepois());
    montagem.trechos.push(trecho.paraJson());
    montagem.efeitosSonoros.push(...trecho.efeitosSonoros());
    montagem.totalDeQuadros = trecho.fim();
  });
  return montagem;
}
