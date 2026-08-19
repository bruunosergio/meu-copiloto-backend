import { Store } from '../../entities';

export interface StoreRepository {
  findById(id: string): Promise<Store | null>;
  findByCodigo(codigo: string): Promise<Store | null>;
}

export const STORE_REPOSITORY = 'STORE_REPOSITORY';
