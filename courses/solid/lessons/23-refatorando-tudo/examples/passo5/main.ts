// Raiz de composição: o ÚNICO lugar que conhece tudo e liga as peças de produção.
import { OrderService } from './order-service.ts';
import { OrderRepository } from './order-repository.ts';
import { Notifications } from './notifications.ts';

export const orderService = new OrderService(new OrderRepository(), new Notifications());
