import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StoreRepository } from '../../domain/ports/output';
import { Store } from '../../domain/entities';
import { StoreMapper } from '../mappers';

@Injectable()
export class PrismaStoreRepository implements StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Store | null> {
    const raw = await this.prisma.store.findUnique({ where: { id } });
    return raw ? StoreMapper.toDomain(raw) : null;
  }

  async findByCodigo(codigo: string): Promise<Store | null> {
    const raw = await this.prisma.store.findUnique({ where: { codigo } });
    return raw ? StoreMapper.toDomain(raw) : null;
  }
}
