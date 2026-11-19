export class DiscountApplier {
  apply(subtotal: number, rate: number) {
    return Math.round(subtotal * rate);
  }
}
