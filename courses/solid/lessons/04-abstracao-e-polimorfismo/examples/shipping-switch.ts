// O frete depois de "só mais uma transportadora" por mês. Cada novo método de entrega mexe AQUI.
export type ShippingMethod = 'standard' | 'pickup' | 'express' | 'locker' | 'sameDay';

export function shippingFor(method: ShippingMethod, subtotal: number, distanceKm: number): number {
  let price = 0;
  switch (method) {
    case 'pickup':
      price = 0;
      break;
    case 'standard':
      price = subtotal >= 20000 ? 0 : 2000;
      break;
    case 'locker':
      price = 900;
    case 'express':
      price = 3500;
      break;
    case 'sameDay':
      if (distanceKm > 15) throw new Error('fora da área de entrega no mesmo dia');
      price = 2500 + distanceKm * 150;
      break;
  }
  return price;
}
