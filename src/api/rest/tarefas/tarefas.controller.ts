import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, Sprint, Tarefa } from '../../../domain/entities';
import { TAREFA_USE_CASE, TarefaUseCase } from '../../../domain/ports/input';
import { CurrentUser, JwtAuthGuard, RequestUser, Roles, RolesGuard } from '../../guards';
import { unwrapOrThrow } from '../result-http.helper';
import { CreateSprintDto, CreateTarefaDto, UpdateTarefaDto } from './tarefa.dtos';

/** Quadro de tarefas (kanban com sprints) — restrito a GERENTE e ADMIN. */
@Controller('tarefas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.GERENTE)
export class TarefasController {
  constructor(@Inject(TAREFA_USE_CASE) private readonly tarefaUseCase: TarefaUseCase) {}

  @Get('sprints')
  async listSprints(@CurrentUser() currentUser: RequestUser) {
    const result = await this.tarefaUseCase.listSprints(currentUser.storeId);
    return unwrapOrThrow(result).map((sprint) => this.sprintResponse(sprint));
  }

  @Post('sprints')
  async createSprint(@Body() dto: CreateSprintDto, @CurrentUser() currentUser: RequestUser) {
    const result = await this.tarefaUseCase.createSprint({
      storeId: currentUser.storeId,
      nome: dto.nome,
      inicio: dto.inicio ? new Date(dto.inicio) : null,
      fim: dto.fim ? new Date(dto.fim) : null,
      criadoPorId: currentUser.sub,
    });
    return this.sprintResponse(unwrapOrThrow(result));
  }

  @Patch('sprints/:id/encerrar')
  async encerrarSprint(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
    const result = await this.tarefaUseCase.encerrarSprint(id, currentUser.storeId);
    return this.sprintResponse(unwrapOrThrow(result));
  }

  @Get()
  async listTarefas(
    @CurrentUser() currentUser: RequestUser,
    @Query('sprintId') sprintId?: string,
  ) {
    // sprintId ausente = todas; sprintId=backlog = fora de sprint.
    const filtro = sprintId === undefined ? undefined : sprintId === 'backlog' ? null : sprintId;
    const result = await this.tarefaUseCase.listTarefas(currentUser.storeId, filtro);
    return unwrapOrThrow(result).map((tarefa) => this.tarefaResponse(tarefa));
  }

  @Post()
  async createTarefa(@Body() dto: CreateTarefaDto, @CurrentUser() currentUser: RequestUser) {
    const result = await this.tarefaUseCase.createTarefa({
      storeId: currentUser.storeId,
      sprintId: dto.sprintId ?? null,
      titulo: dto.titulo,
      descricao: dto.descricao ?? null,
      prazo: dto.prazo ? new Date(dto.prazo) : null,
      criadoPorId: currentUser.sub,
    });
    return this.tarefaResponse(unwrapOrThrow(result));
  }

  @Patch(':id')
  async updateTarefa(
    @Param('id') id: string,
    @Body() dto: UpdateTarefaDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    const result = await this.tarefaUseCase.updateTarefa({
      tarefaId: id,
      storeId: currentUser.storeId,
      ...(dto.titulo !== undefined && { titulo: dto.titulo }),
      ...(dto.descricao !== undefined && { descricao: dto.descricao }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.prazo !== undefined && { prazo: dto.prazo ? new Date(dto.prazo) : null }),
      ...(dto.sprintId !== undefined && { sprintId: dto.sprintId }),
    });
    return this.tarefaResponse(unwrapOrThrow(result));
  }

  @Delete(':id')
  async deleteTarefa(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
    unwrapOrThrow(await this.tarefaUseCase.deleteTarefa(id, currentUser.storeId));
    return { ok: true };
  }

  private sprintResponse(sprint: Sprint) {
    return sprint.toPublic();
  }

  private tarefaResponse(tarefa: Tarefa) {
    return tarefa.toPublic();
  }
}
