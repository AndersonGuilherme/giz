// O contrato da porta OrderRepository: o MESMO teste roda contra o fake e contra o Postgres.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { OrderRepository } from './domain/ports.ts';

export function orderRepositoryContract(name: string, make: () => OrderRepository) {
  test(`${name}: o que foi salvo volta igual`, async () => {
    const repository = make();
    const id = await repository.save({ email: 'ana@exemplo.com', total: 27000, discount: 3000 });
    assert.deepEqual(await repository.findById(id), { email: 'ana@exemplo.com', total: 27000, discount: 3000 });
  });
  test(`${name}: id desconhecido não existe`, async () => {
    assert.equal(await make().findById(999), undefined);
  });
}
