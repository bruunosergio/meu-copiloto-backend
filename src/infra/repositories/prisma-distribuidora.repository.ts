import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDistribuidoraData, DistribuidoraRepository } from '../../domain/ports/output';
import { Distribuidora } from '../../domain/entities';
import { DistribuidoraMapper } from '../mappers';

@Injectable()
export class PrismaDistribuidoraRepository implements DistribuidoraRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Distribuidora | null> {
    const raw = await this.prisma.distribuidora.findUnique({ where: { id } });
    return raw ? DistribuidoraMapper.toDomain(raw) : null;
  }

  async findByNome(storeId: string, nome: string): Promise<Distribuidora | null> {
    const raw = await this.prisma.distribuidora.findUnique({
      where: { storeId_nome: { storeId, nome } },
    });
    return raw ? DistribuidoraMapper.toDomain(raw) : null;
  }

  async listByStore(storeId: string): Promise<Distribuidora[]> {
    const raws = await this.prisma.distribuidora.findMany({
      where: { storeId },
      orderBy: { nome: 'asc' },
    });
    return raws.map(DistribuidoraMapper.toDomain);
  }

  async create(data: CreateDistribuidoraData): Promise<Distribuidora> {
    const raw = await this.prisma.distribuidora.create({
      data: { storeId: data.storeId, nome: data.nome },
    });
    return DistribuidoraMapper.toDomain(raw);
  }

  async setAtiva(id: string, ativa: boolean): Promise<Distribuidora> {
    const raw = await this.prisma.distribuidora.update({
      where: { id },
      data: { ativa },
    });
    return DistribuidoraMapper.toDomain(raw);
  }
}
