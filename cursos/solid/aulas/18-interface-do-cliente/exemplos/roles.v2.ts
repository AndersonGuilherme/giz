// Um mês depois: o marketplace precisa dividir o pagamento. Vira um papel novo; os outros nem mudam.
export type * from './roles.ts';
export type Split = { chargeId: string; sellers: Array<{ sellerId: string; amount: number }> };

export interface Splits { // marketplace
  splitPayment(chargeId: string, sellers: Split['sellers']): Split;
}
