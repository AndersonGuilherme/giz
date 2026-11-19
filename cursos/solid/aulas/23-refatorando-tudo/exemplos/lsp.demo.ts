// Demonstração usada na tela: o contrato do frete rodado contra o PASSO 2.
// Não segue o padrão *.test.ts de propósito: o "mesmo dia" lança erro longe da loja.
// Rodar: node --test lsp.demo.ts
import { shippingContract } from './contrato-frete.ts';
import { allMethods } from './passo2/shipping.ts';

shippingContract(allMethods);
