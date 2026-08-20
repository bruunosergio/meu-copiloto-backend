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
  /** Peca emprestada de loja parceira: cria um Emprestimo junto com a falta. */
  emprestada?: boolean;
  emprestadaDe?: string | null;
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
   * para CONCLUIDA (é o momento em que o pedido é feito ao fornecedor). Pode
   * ficar em branco e ser preenchida depois via setDistribuidora().
   */
  distribuidoraId?: string;
}

/**
 * Transicao em lote: o caso real e um unico pedido em uma distribuidora
 * cobrindo varias pecas de uma vez. Valida tudo antes de aplicar qualquer
 * mudanca (tudo ou nada na validacao).
 */
export interface TransitionManyShortagesInput {
  shortageIds: string[];
  novoStatus: ShortageStatus;
  executadoPorId: string;
  distribuidoraId?: string;
  motivo?: string;
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
  transitionMany(input: TransitionManyShortagesInput): Promise<Result<Shortage[], Failure>>;
  setDistribuidora(input: SetShortageDistribuidoraInput): Promise<Result<Shortage, Failure>>;
  cancel(input: CancelShortageInput): Promise<Result<Shortage, Failure>>;
}

export const SHORTAGE_USE_CASE = 'SHORTAGE_USE_CASE';
