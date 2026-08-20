import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateSprintData,
  CreateTarefaData,
  TarefaRepository,
  UpdateTarefaData,
} from '../../domain/ports/output';
import { Sprint, Tarefa } from '../../domain/entities';
import { SprintMapper, TarefaMapper } from '../mappers';

@Injectable()
export class PrismaTarefaRepository implements TarefaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listSprints(storeId: string): Promise<Sprint[]> {
    const raws = await this.prisma.sprint.findMany({
      where: { storeId },
      orderBy: { criadoEm: 'desc' },
    });
    return raws.map(SprintMapper.toDomain);
  }

  async findSprintById(id: string): Promise<Sprint | null> {
    const raw = await this.prisma.sprint.findUnique({ where: { id } });
    return raw ? SprintMapper.toDomain(raw) : null;
  }

  async createSprint(data: CreateSprintData): Promise<Sprint> {
    const raw = await this.prisma.sprint.create({
      data: {
        storeId: data.storeId,
        nome: data.nome,
        inicio: data.inicio,
        fim: data.fim,
        criadoPorId: data.criadoPorId,
      },
    });
    return SprintMapper.toDomain(raw);
  }

  async encerrarSprint(id: string): Promise<Sprint> {
    const raw = await this.prisma.sprint.update({
      where: { id },
      data: { encerrada: true },
    });
    return SprintMapper.toDomain(raw);
  }

  async listTarefas(storeId: string, sprintId?: string | null): Promise<Tarefa[]> {
    const raws = await this.prisma.tarefa.findMany({
      where: { storeId, ...(sprintId !== undefined && { sprintId }) },
      orderBy: { criadoEm: 'asc' },
    });
    return raws.map(TarefaMapper.toDomain);
  }

  async findTarefaById(id: string): Promise<Tarefa | null> {
    const raw = await this.prisma.tarefa.findUnique({ where: { id } });
    return raw ? TarefaMapper.toDomain(raw) : null;
  }

  async createTarefa(data: CreateTarefaData): Promise<Tarefa> {
    const raw = await this.prisma.tarefa.create({
      data: {
        storeId: data.storeId,
        sprintId: data.sprintId,
        titulo: data.titulo,
        descricao: data.descricao,
        prazo: data.prazo,
        criadoPorId: data.criadoPorId,
      },
    });
    return TarefaMapper.toDomain(raw);
  }

  async updateTarefa(id: string, data: UpdateTarefaData): Promise<Tarefa> {
    const raw = await this.prisma.tarefa.update({ where: { id }, data });
    return TarefaMapper.toDomain(raw);
  }

  async deleteTarefa(id: string): Promise<void> {
    await this.prisma.tarefa.delete({ where: { id } });
  }
}
