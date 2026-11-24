// Carrega no registro os plugins ligados na configuração.
import type { TaxPlugin } from './tax-plugin.ts';
import { TaxPluginRegistry } from './registry.ts';
import { defaultTaxPlugin } from './default.ts';
import { pluginConfig } from './config.ts';

const available: Record<string, TaxPlugin> = { default: defaultTaxPlugin };

export function loadPlugins(config = pluginConfig): TaxPluginRegistry {
  const registry = new TaxPluginRegistry();
  for (const id of config.enabled) {
    const plugin = available[id];
    if (!plugin) throw new Error(`plugin desconhecido: ${id}`);
    registry.register(plugin);
  }
  return registry;
}
