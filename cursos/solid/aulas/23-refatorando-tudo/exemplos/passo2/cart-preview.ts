// O carrinho mostra TODAS as opções de frete com o preço de cada uma.
import { allMethods, quoteFor } from './shipping.ts';

export type Cart = { items: Array<{ price: number; quantity: number }>; distanceKm: number };

export function shippingOptions(cart: Cart) {
  const quote = quoteFor(cart.items, cart.distanceKm);
  return allMethods.map((m) => ({ id: m.id, price: m.price(quote) }));
}
