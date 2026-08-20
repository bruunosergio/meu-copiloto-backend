import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateEmprestimoData,
  DevolverEmprestimosData,
  EmprestimoRepository,
} from '../../domain/ports/output';
import { Emprestimo, EmprestimoStatus } from '../../domain/entities';
import { EmprestimoMapper } from '../mappers';

const INCLUDE_RELACOES = {
  shortage: { select: { nomePeca: true, codigoPeca: true, status: true } },
  registradoPor: { select: { nome: true } },
  devolvidoPor: { select: { nome: true } },
} as const;

@Injectable()
export class PrismaEmprestimoRepository implements EmprestimoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEmprestimoData): Promise<Emprestimo> {
    const raw = await this.prisma.emprestimo.create({
      data: {
        storeId: data.storeId,
        shortageId: data.shortageId,
        emprestadaDe: data.emprestadaDe,
        registradoPorId: data.registradoPorId,
      },
      include: INCLUDE_RELACOES,
    });
    return EmprestimoMapper.toDomain(raw);
  }

  async listByStore(storeId: string, status?: EmprestimoStatus): Promise<Emprestimo[]> {
    const raws = await this.prisma.emprestimo.findMany({
      where: { storeId, ...(status && { status }) },
      include: INCLUDE_RELACOES,
      orderBy: { criadoEm: 'asc' },
    });
    return raws.map(EmprestimoMapper.toDomain);
  }

  async findByIds(ids: string[]): Promise<Emprestimo[]> {
    const raws = await this.prisma.emprestimo.findMany({
      where: { id: { in: ids } },
      include: INCLUDE_RELACOES,
    });
    return raws.map(EmprestimoMapper.toDomain);
  }

  async devolver(data: DevolverEmprestimosData): Promise<Emprestimo[]> {
    await this.prisma.emprestimo.updateMany({
      where: { id: { in: data.ids } },
      data: {
        status: EmprestimoStatus.DEVOLVIDA,
        devolvidoPorId: data.devolvidoPorId,
        devolvidoPara: data.devolvidoPara,
        devolvidoEm: new Date(),
      },
    });
    return this.findByIds(data.ids);
  }
}
