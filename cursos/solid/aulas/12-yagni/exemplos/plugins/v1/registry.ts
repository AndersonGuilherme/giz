// Registro de plugins: cadastra, remove e escolhe o plugin de cada item.
import type { TaxItem, TaxPlugin } from './tax-plugin.ts';

export class TaxPluginRegistry {
  private readonly plugins = new Map<string, TaxPlugin>();

  register(plugin: TaxPlugin): void {
    if (this.plugins.has(plugin.id)) throw new Error(`plugin duplicado: ${plugin.id}`);
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): void {
    this.plugins.delete(id);
  }

  resolve(item: TaxItem): TaxPlugin {
    const candidates = [...this.plugins.values()].filter((p) => p.appliesTo(item));
    if (candidates.length === 0) throw new Error(`nenhum plugin para ${item.sku}`);
    return candidates.sort((a, b) => b.priority - a.priority)[0];
  }
}
