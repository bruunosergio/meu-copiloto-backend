import { Result } from '../../core/result';
import { Failure } from '../../failures';
import { Sprint, Tarefa, TarefaStatus } from '../../entities';

export interface CreateSprintInput {
  storeId: string;
  nome: string;
  inicio: Date | null;
  fim: Date | null;
  criadoPorId: string;
}

export interface CreateTarefaInput {
  storeId: string;
  sprintId: string | null;
  titulo: string;
  descricao: string | null;
  prazo: Date | null;
  criadoPorId: string;
}

export interface UpdateTarefaInput {
  tarefaId: string;
  storeId: string;
  titulo?: string;
  descricao?: string | null;
  status?: TarefaStatus;
  prazo?: Date | null;
  sprintId?: string | null;
}

export interface TarefaUseCase {
  listSprints(storeId: string): Promise<Result<Sprint[], Failure>>;
  createSprint(input: CreateSprintInput): Promise<Result<Sprint, Failure>>;
  encerrarSprint(sprintId: string, storeId: string): Promise<Result<Sprint, Failure>>;
  listTarefas(storeId: string, sprintId?: string | null): Promise<Result<Tarefa[], Failure>>;
  createTarefa(input: CreateTarefaInput): Promise<Result<Tarefa, Failure>>;
  updateTarefa(input: UpdateTarefaInput): Promise<Result<Tarefa, Failure>>;
  deleteTarefa(tarefaId: string, storeId: string): Promise<Result<void, Failure>>;
}

export const TAREFA_USE_CASE = 'TAREFA_USE_CASE';
