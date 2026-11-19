// Onde a loja é montada: a lista de promoções ativas.
import { PriceCalculator } from './price-calculator.ts';
import { vip, employee, blackFriday, coupon } from './rules.ts';

export const calculator = new PriceCalculator([
  vip,
  employee,
  blackFriday,
  coupon('BEMVINDO', 2500),
]);
