// Um contrato, duas implementações: o fake rápido e o adaptador lento, que roda em menos lugares.
import './test-env.ts';
import { orderRepositoryContract } from './repository-contract.ts';
import { InMemoryOrderRepository } from './doubles.ts';
import { PostgresOrderRepository } from './infra/postgres-order-repository.ts';

orderRepositoryContract('fake', () => new InMemoryOrderRepository());
orderRepositoryContract('Postgres', () => new PostgresOrderRepository());
