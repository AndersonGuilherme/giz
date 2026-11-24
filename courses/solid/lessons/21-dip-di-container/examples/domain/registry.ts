// Um registro global, no domínio: quem quiser uma peça vem buscar aqui pelo nome.
const pieces = new Map<string, unknown>();

export const registry = {
  put(name: string, piece: unknown) { pieces.set(name, piece); },
  get<T>(name: string): T {
    if (!pieces.has(name)) throw new Error(`nada registrado como "${name}"`);
    return pieces.get(name) as T;
  },
};
