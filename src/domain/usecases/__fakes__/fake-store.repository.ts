import { StoreRepository } from '../../ports/output';
import { Store } from '../../entities';

export class FakeStoreRepository implements StoreRepository {
  private stores: Store[] = [];

  seed(store: Store) {
    this.stores.push(store);
  }

  async findById(id: string): Promise<Store | null> {
    return this.stores.find((s) => s.id === id) ?? null;
  }

  async findByCodigo(codigo: string): Promise<Store | null> {
    return this.stores.find((s) => s.codigo === codigo) ?? null;
  }
}
