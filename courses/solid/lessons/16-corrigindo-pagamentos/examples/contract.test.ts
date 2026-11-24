// O mesmo contrato para TODO pagamento que declara a capacidade.
import { refundableContract, capturableContract, day } from './contract.ts';
import { creditCard, pix, boleto } from './methods.ts';
import { digitalWallet } from './wallet.ts';

const ledger = { payouts: [] as string[] };
const captured = (p: ReturnType<typeof creditCard>) => { p.capture!.capture(day(0)); return p.refunds!; };

refundableContract('cartão', () => captured(creditCard(8000, ledger)));
refundableContract('pix', () => pix(8000, day(0), ledger).refunds!);
refundableContract('boleto', () => boleto(8000, day(0), ledger).refunds!);
refundableContract('carteira digital', () => captured(digitalWallet(8000, ledger)));

capturableContract('cartão', () => creditCard(8000, ledger).capture!);
capturableContract('carteira digital', () => digitalWallet(8000, ledger).capture!);
