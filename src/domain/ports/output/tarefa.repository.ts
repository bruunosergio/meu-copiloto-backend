import { Sprint, Tarefa, TarefaStatus } from '../../entities';

export interface CreateSprintData {
  storeId: string;
  nome: string;
  inicio: Date | null;
  fim: Date | null;
  criadoPorId: string;
}

export interface CreateTarefaData {
  storeId: string;
  sprintId: string | null;
  titulo: string;
  descricao: string | null;
  prazo: Date | null;
  criadoPorId: string;
}

export interface UpdateTarefaData {
  titulo?: string;
  descricao?: string | null;
  status?: TarefaStatus;
  prazo?: Date | null;
  sprintId?: string | null;
  concluidaEm?: Date | null;
}

export interface TarefaRepository {
  listSprints(storeId: string): Promise<Sprint[]>;
  findSprintById(id: string): Promise<Sprint | null>;
  createSprint(data: CreateSprintData): Promise<Sprint>;
  encerrarSprint(id: string): Promise<Sprint>;
  listTarefas(storeId: string, sprintId?: string | null): Promise<Tarefa[]>;
  findTarefaById(id: string): Promise<Tarefa | null>;
  createTarefa(data: CreateTarefaData): Promise<Tarefa>;
  updateTarefa(id: string, data: UpdateTarefaData): Promise<Tarefa>;
  deleteTarefa(id: string): Promise<void>;
}

export const TAREFA_REPOSITORY = 'TAREFA_REPOSITORY';
