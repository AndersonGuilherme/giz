// Mostrado na tela: a caracterização contra a primeira tentativa do passo 1. Falha de propósito.
import { characterize } from './characterization.ts';
import { OrderService } from './order-service.step1-wrong.ts';

characterize('passo 1', OrderService);
