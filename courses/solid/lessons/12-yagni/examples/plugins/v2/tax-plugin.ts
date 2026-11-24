// Ponto de extensão "para o futuro": qualquer regra de imposto vira um plugin.
export type TaxItem = { sku: string; category: string; amount: number };
export type TaxQuery = { item: TaxItem; state: string }; // o plugin não sabia o destino

export interface TaxPlugin {
  readonly id: string;
  readonly priority: number; // o maior vence
  appliesTo(query: TaxQuery): boolean;
  rate(query: TaxQuery): number;
}
