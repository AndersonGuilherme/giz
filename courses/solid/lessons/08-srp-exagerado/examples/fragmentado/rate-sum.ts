export class RateSum {
  total(rates: number[]) {
    return rates.reduce((a, b) => a + b, 0);
  }
}
