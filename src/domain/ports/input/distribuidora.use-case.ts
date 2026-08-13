import { Result } from '../../core/result';
import { Failure } from '../../failures';
import { Distribuidora } from '../../entities';

export interface CreateDistribuidoraInput {
  storeId: string;
  nome: string;
}

export interface DistribuidoraUseCase {
  create(input: CreateDistribuidoraInput): Promise<Result<Distribuidora, Failure>>;
  listByStore(storeId: string): Promise<Result<Distribuidora[], Failure>>;
  setAtiva(id: string, ativa: boolean): Promise<Result<Distribuidora, Failure>>;
}

export const DISTRIBUIDORA_USE_CASE = 'DISTRIBUIDORA_USE_CASE';
