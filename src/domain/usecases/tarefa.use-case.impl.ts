import { Result } from '../core/result';
import {
  Failure,
  NotFoundFailure,
  UnexpectedFailure,
  ValidationFailure,
} from '../failures';
import {
  CreateSprintInput,
  CreateTarefaInput,
  TarefaUseCase,
  UpdateTarefaInput,
} from '../ports/input';
import { TarefaRepository, UpdateTarefaData } from '../ports/output';
import { Sprint, Tarefa, TarefaStatus } from '../entities';

/**
 * Quadro de tarefas do GERENTE/ADMIN. A restricao de papel e aplicada na
 * borda (RolesGuard no controller), como nas rotas de usuarios.
 */
export class TarefaUseCaseImpl implements TarefaUseCase {
  constructor(private readonly tarefaRepository: TarefaRepository) {}

  async listSprints(storeId: string): Promise<Result<Sprint[], Failure>> {
    try {
      return Result.ok(await this.tarefaRepository.listSprints(storeId));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async createSprint(input: CreateSprintInput): Promise<Result<Sprint, Failure>> {
    try {
      if (!input.nome.trim()) {
        return Result.error(new ValidationFailure('O nome da sprint e obrigatorio.'));
      }
      if (input.inicio && input.fim && input.fim < input.inicio) {
        return Result.error(new ValidationFailure('O fim da sprint nao pode ser antes do inicio.'));
      }
      const sprint = await this.tarefaRepository.createSprint({
        ...input,
        nome: input.nome.trim(),
      });
      return Result.ok(sprint);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async encerrarSprint(sprintId: string, storeId: string): Promise<Result<Sprint, Failure>> {
    try {
      const sprint = await this.tarefaRepository.findSprintById(sprintId);
      if (!sprint || sprint.storeId !== storeId) {
        return Result.error(new NotFoundFailure('Sprint', sprintId));
      }
      if (sprint.encerrada) {
        return Result.error(new ValidationFailure('Esta sprint ja foi encerrada.'));
      }
      return Result.ok(await this.tarefaRepository.encerrarSprint(sprintId));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async listTarefas(
    storeId: string,
    sprintId?: string | null,
  ): Promise<Result<Tarefa[], Failure>> {
    try {
      return Result.ok(await this.tarefaRepository.listTarefas(storeId, sprintId));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async createTarefa(input: CreateTarefaInput): Promise<Result<Tarefa, Failure>> {
    try {
      if (!input.titulo.trim()) {
        return Result.error(new ValidationFailure('O titulo da tarefa e obrigatorio.'));
      }
      const sprintCheck = await this.validarSprint(input.sprintId, input.storeId);
      if (sprintCheck) return Result.error(sprintCheck);

      const tarefa = await this.tarefaRepository.createTarefa({
        ...input,
        titulo: input.titulo.trim(),
        descricao: input.descricao?.trim() ? input.descricao.trim() : null,
      });
      return Result.ok(tarefa);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async updateTarefa(input: UpdateTarefaInput): Promise<Result<Tarefa, Failure>> {
    try {
      const tarefa = await this.tarefaRepository.findTarefaById(input.tarefaId);
      if (!tarefa || tarefa.storeId !== input.storeId) {
        return Result.error(new NotFoundFailure('Tarefa', input.tarefaId));
      }

      if (input.titulo !== undefined && !input.titulo.trim()) {
        return Result.error(new ValidationFailure('O titulo da tarefa e obrigatorio.'));
      }
      if (input.sprintId !== undefined) {
        const sprintCheck = await this.validarSprint(input.sprintId, input.storeId);
        if (sprintCheck) return Result.error(sprintCheck);
      }

      const data: UpdateTarefaData = {
        ...(input.titulo !== undefined && { titulo: input.titulo.trim() }),
        ...(input.descricao !== undefined && {
          descricao: input.descricao?.trim() ? input.descricao.trim() : null,
        }),
        ...(input.prazo !== undefined && { prazo: input.prazo }),
        ...(input.sprintId !== undefined && { sprintId: input.sprintId }),
      };

      // concluidaEm acompanha o status: marca ao entrar em CONCLUIDA e limpa
      // se a tarefa voltar para o quadro (arrastar de volta no kanban).
      if (input.status !== undefined && input.status !== tarefa.status) {
        data.status = input.status;
        data.concluidaEm = input.status === TarefaStatus.CONCLUIDA ? new Date() : null;
      }

      return Result.ok(await this.tarefaRepository.updateTarefa(input.tarefaId, data));
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  async deleteTarefa(tarefaId: string, storeId: string): Promise<Result<void, Failure>> {
    try {
      const tarefa = await this.tarefaRepository.findTarefaById(tarefaId);
      if (!tarefa || tarefa.storeId !== storeId) {
        return Result.error(new NotFoundFailure('Tarefa', tarefaId));
      }
      await this.tarefaRepository.deleteTarefa(tarefaId);
      return Result.ok(undefined);
    } catch (error) {
      return Result.error(new UnexpectedFailure(error));
    }
  }

  private async validarSprint(
    sprintId: string | null,
    storeId: string,
  ): Promise<Failure | null> {
    if (!sprintId) return null;
    const sprint = await this.tarefaRepository.findSprintById(sprintId);
    if (!sprint || sprint.storeId !== storeId) {
      return new NotFoundFailure('Sprint', sprintId);
    }
    return null;
  }
}
