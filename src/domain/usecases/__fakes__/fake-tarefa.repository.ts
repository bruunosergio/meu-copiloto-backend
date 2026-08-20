import {
  CreateSprintData,
  CreateTarefaData,
  TarefaRepository,
  UpdateTarefaData,
} from '../../ports/output';
import { Sprint, Tarefa, TarefaStatus } from '../../entities';

export class FakeTarefaRepository implements TarefaRepository {
  private sprints: Sprint[] = [];
  private tarefas: Tarefa[] = [];
  private nextSprintId = 1;
  private nextTarefaId = 1;

  async listSprints(storeId: string): Promise<Sprint[]> {
    return this.sprints.filter((s) => s.storeId === storeId);
  }

  async findSprintById(id: string): Promise<Sprint | null> {
    return this.sprints.find((s) => s.id === id) ?? null;
  }

  async createSprint(data: CreateSprintData): Promise<Sprint> {
    const sprint = new Sprint({
      id: `sprint-${this.nextSprintId++}`,
      storeId: data.storeId,
      nome: data.nome,
      inicio: data.inicio,
      fim: data.fim,
      encerrada: false,
      criadoPorId: data.criadoPorId,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    this.sprints.push(sprint);
    return sprint;
  }

  async encerrarSprint(id: string): Promise<Sprint> {
    const index = this.sprints.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Sprint nao encontrada no fake repository.');
    const atual = this.sprints[index].toPublic();
    const atualizada = new Sprint({ ...atual, encerrada: true, atualizadoEm: new Date() });
    this.sprints[index] = atualizada;
    return atualizada;
  }

  async listTarefas(storeId: string, sprintId?: string | null): Promise<Tarefa[]> {
    return this.tarefas.filter(
      (t) => t.storeId === storeId && (sprintId === undefined || t.sprintId === sprintId),
    );
  }

  async findTarefaById(id: string): Promise<Tarefa | null> {
    return this.tarefas.find((t) => t.id === id) ?? null;
  }

  async createTarefa(data: CreateTarefaData): Promise<Tarefa> {
    const tarefa = new Tarefa({
      id: `tarefa-${this.nextTarefaId++}`,
      storeId: data.storeId,
      sprintId: data.sprintId,
      titulo: data.titulo,
      descricao: data.descricao,
      status: TarefaStatus.A_FAZER,
      prazo: data.prazo,
      criadoPorId: data.criadoPorId,
      concluidaEm: null,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    });
    this.tarefas.push(tarefa);
    return tarefa;
  }

  async updateTarefa(id: string, data: UpdateTarefaData): Promise<Tarefa> {
    const index = this.tarefas.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Tarefa nao encontrada no fake repository.');
    const atual = this.tarefas[index].toPublic();
    const atualizada = new Tarefa({ ...atual, ...data, atualizadoEm: new Date() });
    this.tarefas[index] = atualizada;
    return atualizada;
  }

  async deleteTarefa(id: string): Promise<void> {
    this.tarefas = this.tarefas.filter((t) => t.id !== id);
  }
}
