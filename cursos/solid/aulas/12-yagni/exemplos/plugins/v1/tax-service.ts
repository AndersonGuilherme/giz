// O serviço que o checkout chama: pergunta ao registro qual plugin vale para cada item.
import type { TaxItem } from './tax-plugin.ts';
import { TaxPluginRegistry } from './registry.ts';
import { loadPlugins } from './loader.ts';

export class TaxService {
  private readonly registry: TaxPluginRegistry;
  constructor(registry = loadPlugins()) {
    this.registry = registry;
  }

  taxFor(items: TaxItem[]): number {
    return items.reduce((sum, item) => {
      const plugin = this.registry.resolve(item);
      return sum + Math.round(item.amount * plugin.rate(item));
    }, 0);
  }
}
