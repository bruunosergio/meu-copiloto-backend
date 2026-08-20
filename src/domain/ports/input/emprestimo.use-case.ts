import { Result } from '../../core/result';
import { Failure } from '../../failures';
import { Emprestimo, EmprestimoStatus } from '../../entities';

export interface ListEmprestimosInput {
  storeId: string;
  status?: EmprestimoStatus;
}

export interface DevolverEmprestimosInput {
  ids: string[];
  storeId: string;
  executadoPorId: string;
  /** A quem a peca foi devolvida (loja/pessoa parceira). */
  devolvidoPara: string;
}

export interface EmprestimoUseCase {
  list(input: ListEmprestimosInput): Promise<Result<Emprestimo[], Failure>>;
  devolver(input: DevolverEmprestimosInput): Promise<Result<Emprestimo[], Failure>>;
}

export const EMPRESTIMO_USE_CASE = 'EMPRESTIMO_USE_CASE';
