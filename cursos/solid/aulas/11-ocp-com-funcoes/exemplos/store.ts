// A loja inteira é uma expressão. Promoção nova = uma linha.
import { percentOff, fixedOff, isVip, isEmployee, onBlackFriday, couponIs, between } from './rules-fn.ts';
import { bestOf, capped } from './combinators.ts';

export const discount = capped(
  bestOf(
    percentOff(0.1, isVip),
    percentOff(0.3, isEmployee),
    percentOff(0.2, onBlackFriday),
    fixedOff(2500, couponIs('BEMVINDO')),
    percentOff(0.15, between('2026-05-04', '2026-05-10')),
  ),
);
