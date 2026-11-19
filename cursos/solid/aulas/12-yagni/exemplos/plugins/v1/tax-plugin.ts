// Ponto de extensão "para o futuro": qualquer regra de imposto vira um plugin.
export type TaxItem = { sku: string; category: string; amount: number };

export interface TaxPlugin {
  readonly id: string;
  readonly priority: number; // o maior vence
  appliesTo(item: TaxItem): boolean;
  rate(item: TaxItem): number;
}
