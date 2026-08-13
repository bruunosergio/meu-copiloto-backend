import { Result } from '../../core/result';
import { Failure } from '../../failures';
import { Shortage, ShortageOrigin, ShortageStatus } from '../../entities';

export interface RegisterShortageInput {
  storeId: string;
  codigoPeca: string | null;
  nomePeca: string;
  qtdRestante: number;
  observacao: string | null;
  registradoPorId: string;
  origem: ShortageOrigin;
}

export interface ListShortagesInput {
  storeId: string;
  status?: ShortageStatus[];
  apenasDoUsuarioId?: string;
}

export interface TransitionShortageInput {
  shortageId: string;
  novoStatus: ShortageStatus;
  executadoPorId: string;
  motivo?: string;
  /**
   * Distribuidora vencedora da cotação. Opcional; só é aceita ao transicionar
   * para COMPRADA (é o momento em que o pedido é feito ao fornecedor). Pode
   * ficar em branco e ser preenchida depois via setDistribuidora().
   */
  distribuidoraId?: string;
}

export interface SetShortageDistribuidoraInput {
  shortageId: string;
  distribuidoraId: string | null;
  executadoPorId: string;
}

export interface CancelShortageInput {
  shortageId: string;
  executadoPorId: string;
  motivo: string;
}

export interface ShortageUseCase {
  register(input: RegisterShortageInput): Promise<Result<Shortage, Failure>>;
  list(input: ListShortagesInput): Promise<Result<Shortage[], Failure>>;
  getById(id: string): Promise<Result<Shortage, Failure>>;
  transition(input: TransitionShortageInput): Promise<Result<Shortage, Failure>>;
  setDistribuidora(input: SetShortageDistribuidoraInput): Promise<Result<Shortage, Failure>>;
  cancel(input: CancelShortageInput): Promise<Result<Shortage, Failure>>;
}

export const SHORTAGE_USE_CASE = 'SHORTAGE_USE_CASE';
