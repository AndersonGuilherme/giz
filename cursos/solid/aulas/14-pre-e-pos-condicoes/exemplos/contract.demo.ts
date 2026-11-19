// Mostrado na tela: o MESMO contrato aplicado a todos os subtipos. Pix e boleto falham de propósito.
// Rodar: node --test contract.demo.ts
import { paymentContract } from './contract.ts';
import { CreditCardPayment } from './payment.ts';
import { PixPayment } from './pix.ts';
import { BoletoPayment } from './boleto.ts';

paymentContract('CreditCardPayment', (amount) => new CreditCardPayment(amount));
paymentContract('PixPayment', (amount) => new PixPayment(amount));
paymentContract('BoletoPayment', (amount) => new BoletoPayment(amount));
