// Portas: o DOMÍNIO diz do que precisa, na língua dele. A infra é que se adapta.
export type PlacedOrder = { email: string; total: number; discount: number };

export interface OrderRepository {
  save(order: PlacedOrder): Promise<number>;
}

export interface Notifier {
  orderConfirmed(email: string, total: number, saved: number): Promise<void>;
}
