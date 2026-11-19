// O contrato das promoções. Valores em centavos.
export type Customer = { type: 'regular' | 'vip' | 'employee'; birthMonth: number };

export type DiscountContext = {
  subtotal: number;
  customer: Customer;
  now: Date;
  coupon?: string; // opcional: quem não usa cupom nem percebe
};

export interface DiscountRule {
  readonly name: string; // vai para o e-mail: "você economizou R$ Y"
  amount(ctx: DiscountContext): number; // centavos; 0 = não se aplica
}
