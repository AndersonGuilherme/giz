// Tipos de pagamento compartilhados pelos papéis. Valores em centavos.
export type Status = 'authorized' | 'pending' | 'paid' | 'canceled' | 'refunded';
export type Charge = { id: string; orderId: string; amount: number; status: Status; qrCode?: string };
export type Refund = { chargeId: string; amount: number };
export type Dispute = { chargeId: string; evidence: string };
