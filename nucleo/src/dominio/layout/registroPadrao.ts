import { registrarLayoutsDeAula } from './layoutsDeAula.ts';
import { RegistroDeLayouts } from './RegistroDeLayouts.ts';

/** Registro com os layouts de todas as cenas conhecidas; cada chamada cria um registro novo. */
export function criarRegistroDeLayouts(): RegistroDeLayouts {
  return registrarLayoutsDeAula(RegistroDeLayouts.vazio());
}
