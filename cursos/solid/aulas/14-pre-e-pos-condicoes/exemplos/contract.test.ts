// O contrato aplicado ao subtipo que o cumpre: passa.
import { paymentContract } from './contract.ts';
import { CreditCardPayment } from './payment.ts';

paymentContract('CreditCardPayment', (amount) => new CreditCardPayment(amount));
