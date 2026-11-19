// Portas do domínio (aula 20), agora com a consulta do pedido gravado.
export type PlacedOrder = { email: string; total: number; discount: number };

export interface OrderRepository {
  save(order: PlacedOrder): Promise<number>;
  findById(id: number): Promise<PlacedOrder | undefined>;
}

export interface Notifier {
  orderConfirmed(email: string, total: number, saved: number): Promise<void>;
}
