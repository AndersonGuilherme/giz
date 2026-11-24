// Dublês que substituem uma peça sem olhar como ela foi usada.
import type { OrderRepository, Notifier, PlacedOrder } from './domain/ports.ts';

// Dummy: só ocupa o lugar. Se alguém usar, o teste está errado.
const fail = async (): Promise<never> => { throw new Error('dummy: não deveria ser usado'); };
export const dummyRepository: OrderRepository = { save: fail, findById: fail };
export const dummyNotifier: Notifier = { orderConfirmed: fail };

// Stub: devolve uma resposta pronta, sempre a mesma.
export const stubRepository = (id: number): OrderRepository => ({
  save: async () => id,
  findById: async () => undefined,
});
export const stubNotifier: Notifier = { orderConfirmed: async () => {} };

// Fake: funciona de verdade, mas por um atalho (memória em vez de banco).
export class InMemoryOrderRepository implements OrderRepository {
  private rows = new Map<number, PlacedOrder>();
  async save(order: PlacedOrder) {
    this.rows.set(this.rows.size + 1, order);
    return this.rows.size;
  }
  async findById(id: number) { return this.rows.get(id); }
}
