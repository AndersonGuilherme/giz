// Um container mínimo: guarda receitas por nome e monta as peças quando alguém pede.
type Factory = (c: Container) => unknown;

export class Container {
  private factories = new Map<string, Factory>();
  private instances = new Map<string, unknown>();

  register(name: string, factory: Factory) {
    this.factories.set(name, factory);
  }

  resolve<T>(name: string): T {
    if (!this.instances.has(name)) {
      const factory = this.factories.get(name);
      if (!factory) throw new Error(`nada registrado como "${name}"`);
      this.instances.set(name, factory(this));
    }
    return this.instances.get(name) as T;
  }
}
