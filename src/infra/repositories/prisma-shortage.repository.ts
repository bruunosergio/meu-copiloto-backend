import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateShortageData,
  ShortageFilters,
  ShortageRepository,
  UpdateShortageData,
} from '../../domain/ports/output';
import { Shortage, ShortageStatus, StatusTransition } from '../../domain/entities';
import { ShortageMapper, StatusTransitionMapper } from '../mappers';

/**
 * Toda leitura carrega junto o nome de quem registrou (registradoPor.nome):
 * a fila do comprador mostra "por Fulano" sem uma segunda chamada.
 */
const INCLUDE_REGISTRADO_POR = { registradoPor: { select: { nome: true } } } as const;

@Injectable()
export class PrismaShortageRepository implements ShortageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Shortage | null> {
    const raw = await this.prisma.shortage.findUnique({
      where: { id },
      include: INCLUDE_REGISTRADO_POR,
    });
    return raw ? ShortageMapper.toDomain(raw) : null;
  }

  async list(filters: ShortageFilters): Promise<Shortage[]> {
    const raws = await this.prisma.shortage.findMany({
      where: {
        storeId: filters.storeId,
        ...(filters.status && filters.status.length > 0 && { status: { in: filters.status } }),
        ...(filters.registradoPorId && { registradoPorId: filters.registradoPorId }),
      },
      include: INCLUDE_REGISTRADO_POR,
      orderBy: { criadaEm: 'asc' },
    });
    return raws.map(ShortageMapper.toDomain);
  }

  async create(data: CreateShortageData): Promise<Shortage> {
    const raw = await this.prisma.shortage.create({
      data: {
        storeId: data.storeId,
        codigoPeca: data.codigoPeca,
        nomePeca: data.nomePeca,
        qtdRestante: data.qtdRestante,
        observacao: data.observacao,
        registradoPorId: data.registradoPorId,
        origem: data.origem,
      },
      include: INCLUDE_REGISTRADO_POR,
    });
    return ShortageMapper.toDomain(raw);
  }

  async update(id: string, data: UpdateShortageData): Promise<Shortage> {
    const raw = await this.prisma.shortage.update({
      where: { id },
      data: {
        ...(data.codigoPeca !== undefined && { codigoPeca: data.codigoPeca }),
        ...(data.nomePeca !== undefined && { nomePeca: data.nomePeca }),
        ...(data.qtdRestante !== undefined && { qtdRestante: data.qtdRestante }),
        ...(data.observacao !== undefined && { observacao: data.observacao }),
      },
      include: INCLUDE_REGISTRADO_POR,
    });
    return ShortageMapper.toDomain(raw);
  }

  async updateStatus(
    id: string,
    status: ShortageStatus,
    distribuidoraId?: string | null,
  ): Promise<Shortage> {
    const raw = await this.prisma.shortage.update({
      where: { id },
      data: {
        status,
        ...(distribuidoraId !== undefined && { distribuidoraId }),
      },
      include: INCLUDE_REGISTRADO_POR,
    });
    return ShortageMapper.toDomain(raw);
  }

  async setDistribuidora(id: string, distribuidoraId: string | null): Promise<Shortage> {
    const raw = await this.prisma.shortage.update({
      where: { id },
      data: { distribuidoraId },
      include: INCLUDE_REGISTRADO_POR,
    });
    return ShortageMapper.toDomain(raw);
  }

  async recordTransition(data: {
    shortageId: string;
    de: ShortageStatus | null;
    para: ShortageStatus;
    executadaPorId: string;
    motivo: string | null;
  }): Promise<StatusTransition> {
    const raw = await this.prisma.statusTransition.create({
      data: {
        shortageId: data.shortageId,
        de: data.de,
        para: data.para,
        executadaPorId: data.executadaPorId,
        motivo: data.motivo,
      },
    });
    return StatusTransitionMapper.toDomain(raw);
  }

  async listTransitions(shortageId: string): Promise<StatusTransition[]> {
    const raws = await this.prisma.statusTransition.findMany({
      where: { shortageId },
      orderBy: { ocorridaEm: 'asc' },
    });
    return raws.map(StatusTransitionMapper.toDomain);
  }
}
