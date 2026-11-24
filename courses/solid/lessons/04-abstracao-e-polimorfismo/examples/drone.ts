// Método novo: um arquivo novo. Nenhuma linha do checkout nem dos outros métodos foi tocada.
import type { ShippingMethod } from './shipping.ts';

export const drone: ShippingMethod = { id: 'drone', price: ({ distanceKm }) => 1500 + distanceKm * 100 };
