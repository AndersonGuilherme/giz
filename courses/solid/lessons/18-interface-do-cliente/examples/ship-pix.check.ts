// Tenta despachar um pedido Pix, como na aula 17. NÃO compila de propósito: Pix não cumpre o papel Captures.
import { PixGateway } from './pix-gateway.ts';
import { onShipped } from './on-shipped.ts';

const pix = new PixGateway();
const c = pix.charge('p3', 5000);
onShipped(pix, c.id, true);
