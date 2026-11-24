import type { Payment } from './payment.ts';

// Código NOVO, escrito por quem só leu a classe base:
// toda noite, captura os pedidos que saíram para entrega.
export function captureShipped(payments: Payment[], now: Date) {
  for (const p of payments) if (p.status === 'authorized') p.capture(now);
}
