import { Distribuidora } from '../../entities';

export interface CreateDistribuidoraData {
  storeId: string;
  nome: string;
}

export interface DistribuidoraRepository {
  findById(id: string): Promise<Distribuidora | null>;
  findByNome(storeId: string, nome: string): Promise<Distribuidora | null>;
  listByStore(storeId: string): Promise<Distribuidora[]>;
  create(data: CreateDistribuidoraData): Promise<Distribuidora>;
  setAtiva(id: string, ativa: boolean): Promise<Distribuidora>;
}

export const DISTRIBUIDORA_REPOSITORY = 'DISTRIBUIDORA_REPOSITORY';
