import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CobrancaAcompanhamento,
  CobrancaConfig,
  CobrancaRegra,
  CobrancaRelatorio,
  CobrancaStatus,
} from '../../domain/entities';
import {
  CobrancaRepository,
  CreateCobrancaRegraData,
  SaveCobrancaRelatorioData,
  UpsertCobrancaAcompanhamentoData,
} from '../../domain/ports/output';
import { PrismaService } from '../database/prisma.service';
import { CobrancaMapper } from '../mappers';

@Injectable()
export class PrismaCobrancaRepository implements CobrancaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRelatorio(storeId: string): Promise<CobrancaRelatorio | null> {
    const raw = await this.prisma.cobrancaRelatorio.findUnique({ where: { storeId } });
    return raw ? CobrancaMapper.relatorioToDomain(raw) : null;
  }

  async saveRelatorio(data: SaveCobrancaRelatorioData): Promise<CobrancaRelatorio> {
    const payload = {
      referencia: data.referencia,
      fonte: data.fonte,
      clientes: data.clientes as unknown as Prisma.InputJsonValue,
      importadoPorId: data.importadoPorId,
      importadoEm: new Date(),
    };
    const raw = await this.prisma.cobrancaRelatorio.upsert({
      where: { storeId: data.storeId },
      create: { storeId: data.storeId, ...payload },
      update: payload,
    });
    return CobrancaMapper.relatorioToDomain(raw);
  }

  async listAcompanhamentos(storeId: string): Promise<CobrancaAcompanhamento[]> {
    const raws = await this.prisma.cobrancaAcompanhamento.findMany({ where: { storeId } });
    return raws.map(CobrancaMapper.acompanhamentoToDomain);
  }

  async upsertAcompanhamento(data: UpsertCobrancaAcompanhamentoData): Promise<CobrancaAcompanhamento> {
    const update = {
      ...(data.telefoneOverride !== undefined && { telefoneOverride: data.telefoneOverride }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.promessa !== undefined && { promessa: data.promessa }),
      ...(data.anotacao !== undefined && { anotacao: data.anotacao }),
    };
    const raw = await this.prisma.cobrancaAcompanhamento.upsert({
      where: { storeId_codigo: { storeId: data.storeId, codigo: data.codigo } },
      create: {
        storeId: data.storeId,
        codigo: data.codigo,
        telefoneOverride: data.telefoneOverride ?? null,
        status: data.status ?? CobrancaStatus.A_COBRAR,
        promessa: data.promessa ?? null,
        anotacao: data.anotacao ?? null,
      },
      update,
    });
    return CobrancaMapper.acompanhamentoToDomain(raw);
  }

  async resetPaidToCharge(storeId: string, codigos: string[]): Promise<void> {
    if (!codigos.length) return;
    await this.prisma.cobrancaAcompanhamento.updateMany({
      where: { storeId, codigo: { in: codigos } },
      data: { status: CobrancaStatus.A_COBRAR },
    });
  }

  async findConfig(storeId: string): Promise<CobrancaConfig | null> {
    const raw = await this.prisma.cobrancaConfig.findUnique({ where: { storeId } });
    return raw ? CobrancaMapper.configToDomain(raw) : null;
  }

  async upsertConfig(storeId: string, dddPadrao: string): Promise<CobrancaConfig> {
    const raw = await this.prisma.cobrancaConfig.upsert({
      where: { storeId },
      create: { storeId, dddPadrao },
      update: { dddPadrao },
    });
    return CobrancaMapper.configToDomain(raw);
  }

  async listRegras(storeId: string): Promise<CobrancaRegra[]> {
    const raws = await this.prisma.cobrancaRegra.findMany({
      where: { storeId },
      orderBy: { criadoEm: 'asc' },
    });
    return raws.map(CobrancaMapper.regraToDomain);
  }

  async createRegras(data: CreateCobrancaRegraData[]): Promise<CobrancaRegra[]> {
    if (!data.length) return [];
    await this.prisma.cobrancaRegra.createMany({ data });
    return this.listRegras(data[0].storeId);
  }

  async createRegra(data: CreateCobrancaRegraData): Promise<CobrancaRegra> {
    const raw = await this.prisma.cobrancaRegra.create({ data });
    return CobrancaMapper.regraToDomain(raw);
  }

  async deleteRegra(id: string, storeId: string): Promise<boolean> {
    const result = await this.prisma.cobrancaRegra.deleteMany({ where: { id, storeId } });
    return result.count > 0;
  }
}
